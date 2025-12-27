import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type ProjectSubmissionPayload = {
  course_id?: string;
  lesson_id?: string;
  submission_text?: string | null;
  submission_url?: string | null;
  attachment_urls?: string[];
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

    const body = (await request.json()) as ProjectSubmissionPayload;

    if (!body?.course_id || !body?.lesson_id) {
      return NextResponse.json({ error: "course_id and lesson_id are required" }, { status: 400 });
    }

    const submissionText = typeof body.submission_text === "string" ? body.submission_text.trim() : "";
    const submissionUrl = typeof body.submission_url === "string" ? body.submission_url.trim() : "";
    const attachmentUrls = normalizeUrls((body as any).attachment_urls);

    if (!submissionText && !submissionUrl) {
      return NextResponse.json({ error: "Provide submission_text or submission_url" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("lesson_project_submissions")
      .upsert(
        {
          user_id: user.id,
          course_id: body.course_id,
          lesson_id: body.lesson_id,
          submission_text: submissionText || null,
          submission_url: submissionUrl || null,
          attachment_urls: attachmentUrls,
          status: "pending_review",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      )
      .select("id,status,submission_text,submission_url,attachment_urls,feedback,reviewed_at,created_at,updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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
      .from("lesson_project_submissions")
      .select("id,status,submission_text,submission_url,attachment_urls,feedback,reviewed_at,created_at,updated_at")
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
