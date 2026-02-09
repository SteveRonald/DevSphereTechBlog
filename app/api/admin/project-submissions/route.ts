import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "all").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10) || 200, 1000);

    const admin = createAdminClient();

    let query = admin
      .from("lesson_project_submissions")
      .select("id,user_id,course_id,lesson_id,submission_text,submission_url,attachment_urls,status,feedback,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const list = data || [];
    const userIds = Array.from(new Set(list.map((s: any) => s.user_id).filter(Boolean)));
    const lessonIds = Array.from(new Set(list.map((s: any) => s.lesson_id).filter(Boolean)));

    const [{ data: users }, { data: lessons }] = await Promise.all([
      userIds.length
        ? admin.from("user_profiles").select("id,email,display_name,first_name,last_name").in("id", userIds)
        : Promise.resolve({ data: [] as any[] } as any),
      lessonIds.length
        ? admin.from("lessons").select("id,title").in("id", lessonIds)
        : Promise.resolve({ data: [] as any[] } as any),
    ]);

    const userById = new Map<string, any>();
    (users || []).forEach((u: any) => userById.set(u.id, u));

    const lessonById = new Map<string, any>();
    (lessons || []).forEach((l: any) => lessonById.set(l.id, l));

    const enriched = list.map((s: any) => ({
      ...s,
      student: userById.get(s.user_id) || null,
      lesson: lessonById.get(s.lesson_id) || null,
    }));

    return NextResponse.json({ submissions: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
