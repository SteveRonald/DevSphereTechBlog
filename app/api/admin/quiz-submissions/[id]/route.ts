import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase-admin";
import { sendEmail } from "@/lib/email";
import { shouldSendReviewNotification } from "@/lib/email-helpers";

type QuizQuestion = {
  question_type?: "multiple_choice" | "free_text";
  question?: string;
  options?: string[];
  correct_answer?: number | string;
  explanation?: string;
  max_marks?: number;
};

type SubmissionAnswer = {
  question_index: number;
  question_type: "multiple_choice" | "free_text";
  selected_option?: number | null;
  answer_text?: string | null;
  // review fields (manual grading)
  awarded_marks?: number | null;
  reviewed_at?: string | null;
  reviewer_id?: string | null;
};

const questionType = (q: QuizQuestion) => q?.question_type || "multiple_choice";

const getCorrectIndex = (q: QuizQuestion): number | null => {
  const raw: any = (q as any)?.correct_answer;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getMaxMarks = (q: QuizQuestion) => {
  const raw = (q as any)?.max_marks;
  return typeof raw === "number" && Number.isFinite(raw) ? Math.max(0, raw) : 1;
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const admin = createAdminClient();

    const { data: submission, error: loadError } = await admin
      .from("lesson_quiz_submissions")
      .select("id,user_id,course_id,lesson_id,answers,attachment_urls,score,total,status,is_passed,created_at,updated_at")
      .eq("id", params.id)
      .single();

    if (loadError) {
      return NextResponse.json({ error: loadError.message }, { status: 400 });
    }

    const { data: lesson, error: lessonError } = await admin
      .from("lessons")
      .select("id,title,content")
      .eq("id", submission.lesson_id)
      .single();

    if (lessonError) {
      return NextResponse.json({ error: lessonError.message }, { status: 400 });
    }

    const questions: QuizQuestion[] = Array.isArray((lesson as any)?.content?.quiz_data?.questions)
      ? (lesson as any).content.quiz_data.questions
      : [];

    const { data: student } = await admin
      .from("user_profiles")
      .select("id,email,display_name,first_name,last_name")
      .eq("id", submission.user_id)
      .single();

    return NextResponse.json({
      submission,
      lesson: { id: lesson.id, title: lesson.title },
      student: student || null,
      questions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const body = (await request.json()) as {
      free_text_grades?: Array<{ question_index: number; awarded_marks: number }>;
    };

    if (!Array.isArray(body.free_text_grades)) {
      return NextResponse.json({ error: "free_text_grades must be an array" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: submission, error: loadError } = await admin
      .from("lesson_quiz_submissions")
      .select("id,user_id,course_id,lesson_id,answers")
      .eq("id", params.id)
      .single();

    if (loadError) {
      return NextResponse.json({ error: loadError.message }, { status: 400 });
    }

    const { data: lesson, error: lessonError } = await admin
      .from("lessons")
      .select("id,content")
      .eq("id", submission.lesson_id)
      .single();

    if (lessonError) {
      return NextResponse.json({ error: lessonError.message }, { status: 400 });
    }

    const questions: QuizQuestion[] = Array.isArray((lesson as any)?.content?.quiz_data?.questions)
      ? (lesson as any).content.quiz_data.questions
      : [];

    const gradeMap = new Map<number, number>();
    for (const g of body.free_text_grades) {
      if (typeof g?.question_index !== "number" || !Number.isFinite(g.question_index)) continue;
      if (typeof g?.awarded_marks !== "number" || !Number.isFinite(g.awarded_marks)) continue;
      gradeMap.set(g.question_index, Math.max(0, Math.floor(g.awarded_marks)));
    }

    const existingAnswers: SubmissionAnswer[] = Array.isArray(submission.answers)
      ? (submission.answers as any)
      : [];

    const nextAnswers: SubmissionAnswer[] = existingAnswers.map((a) => {
      if (a?.question_type !== "free_text") return a;
      const max = getMaxMarks(questions[a.question_index]);
      const awarded = gradeMap.has(a.question_index)
        ? Math.min(max, gradeMap.get(a.question_index) as number)
        : (a as any)?.awarded_marks ?? null;

      return {
        ...a,
        awarded_marks: typeof awarded === "number" ? awarded : null,
        reviewed_at: new Date().toISOString(),
        reviewer_id: gate.user.id,
      };
    });

    // Compute marks totals using quiz max_marks
    let totalPossible = 0;
    let totalEarned = 0;
    questions.forEach((q, idx) => {
      const max = getMaxMarks(q);
      totalPossible += max;

      const qt = questionType(q);
      const ans = nextAnswers.find((a) => a?.question_index === idx);

      if (qt === "multiple_choice") {
        const correct = getCorrectIndex(q);
        const selected = typeof ans?.selected_option === "number" ? ans.selected_option : null;
        if (typeof correct === "number" && selected === correct) {
          totalEarned += max;
        }
      } else {
        const awarded = typeof (ans as any)?.awarded_marks === "number" ? (ans as any).awarded_marks : 0;
        totalEarned += Math.min(max, Math.max(0, awarded));
      }
    });

    const { data, error } = await admin
      .from("lesson_quiz_submissions")
      .update({
        status: "graded",
        score: totalEarned,
        total: totalPossible,
        answers: nextAnswers as any,
        is_passed: null,
        reviewer_id: gate.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select("id,status,score,total")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Mark lesson complete once review is finalized.
    await admin.from("user_lesson_completion").upsert(
      {
        user_id: submission.user_id,
        lesson_id: submission.lesson_id,
        course_id: submission.course_id,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );

    // Best-effort email to student (do not fail grading if email fails)
    // Check if notifications are enabled before sending
    try {
      const shouldSend = await shouldSendReviewNotification();
      if (!shouldSend) {
        // Notifications disabled, skip email
        return NextResponse.json({ submission: data });
      }

      const [{ data: student }, { data: lesson }, { data: course }] = await Promise.all([
        admin
          .from("user_profiles")
          .select("email")
          .eq("id", submission.user_id)
          .single(),
        admin
          .from("lessons")
          .select("title")
          .eq("id", submission.lesson_id)
          .single(),
        admin
          .from("courses")
          .select("slug, title")
          .eq("id", submission.course_id)
          .single(),
      ]);

      const to = (student as any)?.email;
      if (typeof to === "string" && to.trim()) {
        const lessonTitle = (lesson as any)?.title || "Quiz";
        const courseSlug = (course as any)?.slug;
        const courseTitle = (course as any)?.title || "Course";
        const scoreLine = `Score: ${totalEarned} / ${totalPossible}`;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
        
        // Build course-specific URL
        const courseUrl = courseSlug && siteUrl 
          ? `${siteUrl}/courses/${courseSlug}/learn`
          : siteUrl || "";
        
        const continueLink = courseUrl 
          ? `<p style="margin: 16px 0 0 0;">Continue learning: <a href="${courseUrl}" style="color: #4f46e5; text-decoration: underline;">${courseTitle}</a></p>`
          : siteUrl 
          ? `<p style="margin: 16px 0 0 0;">Continue learning: <a href="${siteUrl}" style="color: #4f46e5; text-decoration: underline;">${siteUrl}</a></p>`
          : "";
        
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
            <h2 style="margin: 0 0 12px 0; color: #111827;">Your quiz review is complete</h2>
            <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>Course:</strong> ${courseTitle}</p>
            <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>Lesson:</strong> ${lessonTitle}</p>
            <p style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">${scoreLine}</p>
            ${continueLink}
          </div>
        `;
        const text = `Your quiz review is complete\n\nCourse: ${courseTitle}\nLesson: ${lessonTitle}\n${scoreLine}${courseUrl ? `\n\nContinue learning: ${courseUrl}` : ""}`;
        await sendEmail({ to, subject: "Quiz review completed - CodeCraft Academy", html, text });
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ submission: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
