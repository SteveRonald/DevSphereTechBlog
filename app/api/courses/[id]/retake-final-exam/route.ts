import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = params.id;
    const supabase = createServerClient(request);

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const {
      data: { user },
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id,content")
      .eq("course_id", courseId);

    if (lessonsError) {
      return NextResponse.json({ error: lessonsError.message }, { status: 400 });
    }

    const finalExamLessonIds = (lessons || [])
      .filter((l: any) => (l?.content?.quiz_data?.assessment_type || "cat") === "final_exam")
      .map((l: any) => l.id);

    if (finalExamLessonIds.length === 0) {
      return NextResponse.json({ error: "Final exam not found for this course" }, { status: 400 });
    }

    // Remove the student's final exam submissions (so they can submit again)
    await supabase
      .from("lesson_quiz_submissions")
      .delete()
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .in("lesson_id", finalExamLessonIds);

    // Remove completion for the final exam lesson(s)
    await supabase
      .from("user_lesson_completion")
      .delete()
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .in("lesson_id", finalExamLessonIds);

    // Clear course completion / pass / score so the user must re-complete via new final exam grading
    await supabase
      .from("user_course_enrollments")
      .update({
        is_completed: false,
        completed_at: null,
        final_score_100: null,
        is_passed: null,
      })
      .eq("user_id", user.id)
      .eq("course_id", courseId);

    return NextResponse.json({ ok: true, final_exam_lessons: finalExamLessonIds.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
