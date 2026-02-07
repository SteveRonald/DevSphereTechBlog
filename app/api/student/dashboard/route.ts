import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { computeCourseGradeSummary } from "@/lib/course-grading";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(request);

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const {
      data: { user },
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("user_course_enrollments")
      .select(
        "id,course_id,enrolled_at,is_completed,completed_at,final_score_100,is_passed,courses(id,title,slug,thumbnail_url,category,difficulty_level)"
      )
      .eq("user_id", user.id)
      .order("enrolled_at", { ascending: false });

    if (enrollmentsError) {
      return NextResponse.json({ error: enrollmentsError.message }, { status: 400 });
    }

    const rows = Array.isArray(enrollments) ? enrollments : [];

    const courseIds = rows.map((e: any) => e.course_id).filter(Boolean);

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id,course_id")
      .in("course_id", courseIds)
      .eq("is_published", true);

    if (lessonsError) {
      return NextResponse.json({ error: lessonsError.message }, { status: 400 });
    }

    const lessonsByCourse = new Map<string, string[]>();
    (lessons || []).forEach((l: any) => {
      if (!lessonsByCourse.has(l.course_id)) lessonsByCourse.set(l.course_id, []);
      lessonsByCourse.get(l.course_id)!.push(l.id);
    });

    const { data: completions, error: completionsError } = await supabase
      .from("user_lesson_completion")
      .select("course_id,lesson_id")
      .eq("user_id", user.id)
      .in("course_id", courseIds);

    if (completionsError) {
      return NextResponse.json({ error: completionsError.message }, { status: 400 });
    }

    const completedByCourse = new Map<string, Set<string>>();
    (completions || []).forEach((c: any) => {
      if (!completedByCourse.has(c.course_id)) completedByCourse.set(c.course_id, new Set());
      completedByCourse.get(c.course_id)!.add(c.lesson_id);
    });

    const [{ data: pendingQuiz }, pendingProjectsRes] = await Promise.all([
      supabase
        .from("lesson_quiz_submissions")
        .select("course_id,lesson_id")
        .eq("user_id", user.id)
        .in("course_id", courseIds)
        .eq("status", "pending_review"),
      supabase
        .from("lesson_project_submissions")
        .select("course_id,lesson_id")
        .eq("user_id", user.id)
        .in("course_id", courseIds)
        .eq("status", "pending_review"),
    ]);

    // If the project submissions table hasn't been migrated yet, ignore it.
    const pendingProjects = (pendingProjectsRes as any)?.error ? [] : (pendingProjectsRes as any)?.data;

    const pendingByCourse = new Map<string, Set<string>>();
    (pendingQuiz || []).forEach((p: any) => {
      if (!pendingByCourse.has(p.course_id)) pendingByCourse.set(p.course_id, new Set());
      pendingByCourse.get(p.course_id)!.add(p.lesson_id);
    });
    (pendingProjects || []).forEach((p: any) => {
      if (!pendingByCourse.has(p.course_id)) pendingByCourse.set(p.course_id, new Set());
      pendingByCourse.get(p.course_id)!.add(p.lesson_id);
    });

    const results = [];
    for (const e of rows) {
      const courseId = e.course_id as string;
      const allLessons = lessonsByCourse.get(courseId) || [];
      const completedSet = completedByCourse.get(courseId) || new Set<string>();
      const pendingSet = pendingByCourse.get(courseId) || new Set<string>();
      const completedOrPending = new Set<string>([...completedSet, ...pendingSet]);

      const progress = allLessons.length > 0 ? Math.round((completedOrPending.size / allLessons.length) * 100) : 0;

      const grades = await computeCourseGradeSummary(supabase as any, user.id, courseId);

      const allLessonsCompleted = allLessons.length > 0 && completedOrPending.size >= allLessons.length;
      const eligibleToComplete = allLessonsCompleted && grades.has_final_exam && grades.final_exam_graded;
      const passed = typeof e?.is_passed === "boolean" ? e.is_passed : eligibleToComplete && grades.final_score_100 >= 70;

      results.push({
        enrollment: e,
        progress,
        grades,
        eligibleToComplete,
        passed,
      });
    }

    return NextResponse.json({ courses: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
