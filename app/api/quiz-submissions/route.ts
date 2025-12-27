import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type SubmissionAnswer = {
  question_index: number;
  question_type: "multiple_choice" | "free_text";
  selected_option?: number | null;
  answer_text?: string | null;
};

const normalizeUrls = (value: any): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 10);
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(request);

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const {
      data: { user },
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      course_id?: string;
      lesson_id?: string;
      answers?: SubmissionAnswer[];
      score?: number | null;
      total?: number | null;
      status?: "pending_review" | "graded";
      attachment_urls?: string[];
    };

    if (!body?.course_id || !body?.lesson_id || !Array.isArray(body?.answers)) {
      return NextResponse.json(
        { error: "course_id, lesson_id, and answers are required" },
        { status: 400 }
      );
    }

    const hasFreeText = body.answers.some((a) => a?.question_type === "free_text");
    const status = hasFreeText ? "pending_review" : "graded";
    const isPassed =
      !hasFreeText &&
      typeof body.score === "number" &&
      typeof body.total === "number" &&
      body.total > 0
        ? body.score / body.total >= 0.7
        : null;

    const attachmentUrls = normalizeUrls((body as any).attachment_urls);

    const { data, error } = await supabase
      .from("lesson_quiz_submissions")
      .upsert(
        {
          user_id: user.id,
          course_id: body.course_id,
          lesson_id: body.lesson_id,
          answers: body.answers,
          attachment_urls: attachmentUrls,
          score: typeof body.score === "number" ? body.score : null,
          total: typeof body.total === "number" ? body.total : null,
          status,
          is_passed: isPassed,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,lesson_id",
        }
      )
      .select("id,status,is_passed,score,total,attachment_urls")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Auto-mark lesson complete for fully auto-graded quizzes (no manual review needed).
    if (status === "graded") {
      await supabase.from("user_lesson_completion").upsert(
        {
          user_id: user.id,
          lesson_id: body.lesson_id,
          course_id: body.course_id,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      );
    }

    return NextResponse.json({ submission: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(request);

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const {
      data: { user },
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lesson_id");

    if (!lessonId) {
      return NextResponse.json({ error: "lesson_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("lesson_quiz_submissions")
      .select("id,status,is_passed,score,total,answers,attachment_urls,created_at,updated_at")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .single();

    if (error) {
      return NextResponse.json({ submission: null });
    }

    return NextResponse.json({ submission: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
