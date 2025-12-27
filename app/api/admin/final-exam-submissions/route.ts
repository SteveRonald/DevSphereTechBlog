import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "pending_review").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10) || 200, 1000);

    const admin = createAdminClient();

    let query = admin
      .from("lesson_quiz_submissions")
      .select("id,user_id,course_id,lesson_id,answers,score,total,status,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: submissions, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const list = submissions || [];
    const lessonIds = Array.from(new Set(list.map((s: any) => s.lesson_id).filter(Boolean)));

    if (lessonIds.length === 0) {
      return NextResponse.json({ submissions: [] });
    }

    const { data: lessons, error: lessonsError } = await admin
      .from("lessons")
      .select("id,content")
      .in("id", lessonIds);

    if (lessonsError) {
      return NextResponse.json({ error: lessonsError.message }, { status: 400 });
    }

    const typeByLessonId = new Map<string, string>();
    (lessons || []).forEach((l: any) => {
      const t = l?.content?.quiz_data?.assessment_type;
      if (typeof t === "string") {
        typeByLessonId.set(l.id, t);
      }
    });

    const filtered = list.filter((s: any) => typeByLessonId.get(s.lesson_id) === "final_exam");

    const userIds = Array.from(new Set(filtered.map((s: any) => s.user_id).filter(Boolean)));
    const lessonIdsFiltered = Array.from(new Set(filtered.map((s: any) => s.lesson_id).filter(Boolean)));

    const [{ data: users }, { data: lessonsMeta }] = await Promise.all([
      userIds.length
        ? admin
            .from("user_profiles")
            .select("id,email,display_name,first_name,last_name")
            .in("id", userIds)
        : Promise.resolve({ data: [] as any[] } as any),
      lessonIdsFiltered.length
        ? admin.from("lessons").select("id,title").in("id", lessonIdsFiltered)
        : Promise.resolve({ data: [] as any[] } as any),
    ]);

    const userById = new Map<string, any>();
    (users || []).forEach((u: any) => userById.set(u.id, u));
    const lessonById = new Map<string, any>();
    (lessonsMeta || []).forEach((l: any) => lessonById.set(l.id, l));

    const enriched = filtered.map((s: any) => ({
      ...s,
      student: userById.get(s.user_id) || null,
      lesson: lessonById.get(s.lesson_id) || null,
    }));

    return NextResponse.json({ submissions: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
