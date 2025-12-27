import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase-admin";

type DayPoint = {
  date: string; // YYYY-MM-DD
  courses_created: number;
  enrollments: number;
  completions: number;
  users_created: number;
  subscribers_created: number;
};

function toDateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get("days") || "30", 10) || 30, 7), 90);

    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const series: DayPoint[] = [];
    const map = new Map<string, DayPoint>();

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = toDateKey(d);
      const point: DayPoint = {
        date: key,
        courses_created: 0,
        enrollments: 0,
        completions: 0,
        users_created: 0,
        subscribers_created: 0,
      };
      series.push(point);
      map.set(key, point);
    }

    const admin = createAdminClient();
    const startIso = start.toISOString();

    const [
      { data: courses, error: coursesError },
      { data: enrollments, error: enrollError },
      { data: completions, error: compError },
      { data: users, error: usersError },
      { data: subscribers, error: subsError },
    ] = await Promise.all([
      admin.from("courses").select("created_at").gte("created_at", startIso).limit(10000),
      admin.from("user_course_enrollments").select("enrolled_at").gte("enrolled_at", startIso).limit(20000),
      admin
        .from("user_course_enrollments")
        .select("completed_at")
        .eq("is_completed", true)
        .gte("completed_at", startIso)
        .limit(20000),
      admin.from("user_profiles").select("created_at").gte("created_at", startIso).limit(20000),
      admin.from("newsletter_subscriptions").select("created_at").gte("created_at", startIso).limit(20000),
    ]);

    if (coursesError) {
      return NextResponse.json({ error: coursesError.message }, { status: 400 });
    }
    if (enrollError) {
      return NextResponse.json({ error: enrollError.message }, { status: 400 });
    }
    if (compError) {
      return NextResponse.json({ error: compError.message }, { status: 400 });
    }
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }
    if (subsError) {
      return NextResponse.json({ error: subsError.message }, { status: 400 });
    }

    for (const c of courses || []) {
      const key = toDateKey(new Date((c as any).created_at));
      const p = map.get(key);
      if (p) p.courses_created += 1;
    }

    for (const e of enrollments || []) {
      const key = toDateKey(new Date((e as any).enrolled_at));
      const p = map.get(key);
      if (p) p.enrollments += 1;
    }

    for (const c of completions || []) {
      const dt = (c as any).completed_at;
      if (!dt) continue;
      const key = toDateKey(new Date(dt));
      const p = map.get(key);
      if (p) p.completions += 1;
    }

    for (const u of users || []) {
      const dt = (u as any).created_at;
      if (!dt) continue;
      const key = toDateKey(new Date(dt));
      const p = map.get(key);
      if (p) p.users_created += 1;
    }

    for (const s of subscribers || []) {
      const dt = (s as any).created_at;
      if (!dt) continue;
      const key = toDateKey(new Date(dt));
      const p = map.get(key);
      if (p) p.subscribers_created += 1;
    }

    const totals = series.reduce(
      (acc, p) => {
        acc.courses_created += p.courses_created;
        acc.enrollments += p.enrollments;
        acc.completions += p.completions;
        acc.users_created += p.users_created;
        acc.subscribers_created += p.subscribers_created;
        return acc;
      },
      { courses_created: 0, enrollments: 0, completions: 0, users_created: 0, subscribers_created: 0 }
    );

    return NextResponse.json({ days, start: startIso, totals, series });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
