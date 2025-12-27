import type { SupabaseClient } from "@supabase/supabase-js";

type GradeSummary = {
  cat_raw: number;
  cat_total_raw: number;
  cat_scaled_30: number;
  exam_raw: number;
  exam_total_raw: number;
  exam_scaled_70: number;
  final_score_100: number;
  has_final_exam: boolean;
  final_exam_pending_review: boolean;
  final_exam_graded: boolean;
};

const safeNumber = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export async function computeCourseGradeSummary(
  supabase: SupabaseClient,
  userId: string,
  courseId: string
): Promise<GradeSummary> {
  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id,content")
    .eq("course_id", courseId)
    .eq("is_published", true);

  if (lessonsError) {
    throw new Error(lessonsError.message);
  }

  const catLessonIds: string[] = [];
  const examLessonIds: string[] = [];

  (lessons || []).forEach((l: any) => {
    const qd = l?.content?.quiz_data;
    const questions = qd?.questions;
    if (!Array.isArray(questions)) return;

    const assessmentType = typeof qd?.assessment_type === "string" ? qd.assessment_type : "cat";
    if (assessmentType === "final_exam") {
      examLessonIds.push(l.id);
    } else {
      catLessonIds.push(l.id);
    }
  });

  const allQuizLessonIds = Array.from(new Set([...catLessonIds, ...examLessonIds]));

  let catRaw = 0;
  let catTotalRaw = 0;
  let examRaw = 0;
  let examTotalRaw = 0;

  let finalExamPendingReview = false;
  let finalExamGraded = false;

  if (allQuizLessonIds.length > 0) {
    const { data: submissions, error: submissionsError } = await supabase
      .from("lesson_quiz_submissions")
      .select("lesson_id,status,score,total")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .in("lesson_id", allQuizLessonIds);

    if (submissionsError) {
      throw new Error(submissionsError.message);
    }

    (submissions || []).forEach((s: any) => {
      const lessonId = s.lesson_id as string;
      const score = safeNumber(s.score);
      const total = safeNumber(s.total);
      const status = typeof s.status === "string" ? s.status : "";

      if (examLessonIds.includes(lessonId)) {
        if (status === "pending_review") {
          finalExamPendingReview = true;
        }
        if (status === "graded") {
          finalExamGraded = true;
          examRaw += score;
          examTotalRaw += total;
        }
      } else if (catLessonIds.includes(lessonId)) {
        if (status === "graded") {
          catRaw += score;
          catTotalRaw += total;
        }
      }
    });
  }

  const catScaled30 = catTotalRaw > 0 ? (catRaw / catTotalRaw) * 30 : 0;
  const examScaled70 = examTotalRaw > 0 ? (examRaw / examTotalRaw) * 70 : 0;

  const finalScore100 = clamp(catScaled30 + examScaled70, 0, 100);

  return {
    cat_raw: catRaw,
    cat_total_raw: catTotalRaw,
    cat_scaled_30: catScaled30,
    exam_raw: examRaw,
    exam_total_raw: examTotalRaw,
    exam_scaled_70: examScaled70,
    final_score_100: finalScore100,
    has_final_exam: examLessonIds.length > 0,
    final_exam_pending_review: finalExamPendingReview,
    final_exam_graded: finalExamGraded,
  };
}
