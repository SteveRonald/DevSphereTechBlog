import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10) || 200, 1000);

    const admin = createAdminClient();

    let query = admin
      .from("newsletter_subscriptions")
      .select("id,email,is_active,notify_new_courses,notify_course_updates,subscribed_at,unsubscribed_at,unsubscribe_reason", {
        count: "exact",
      })
      .order("subscribed_at", { ascending: false })
      .limit(limit);

    if (q) {
      query = query.ilike("email", `%${q}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ subscribers: data || [], count: count || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
