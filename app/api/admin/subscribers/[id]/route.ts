import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const body = await request.json();
    const { is_active, notify_new_courses, notify_course_updates } = body as {
      is_active?: boolean;
      notify_new_courses?: boolean;
      notify_course_updates?: boolean;
    };

    if (
      typeof is_active !== "boolean" &&
      typeof notify_new_courses !== "boolean" &&
      typeof notify_course_updates !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Provide is_active and/or notify_new_courses and/or notify_course_updates (boolean)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const patch: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof is_active === "boolean") {
      patch.is_active = is_active;
      patch.unsubscribed_at = is_active ? null : new Date().toISOString();
    }
    if (typeof notify_new_courses === "boolean") {
      patch.notify_new_courses = notify_new_courses;
    }
    if (typeof notify_course_updates === "boolean") {
      patch.notify_course_updates = notify_course_updates;
    }

    const { data, error } = await admin
      .from("newsletter_subscriptions")
      .update(patch)
      .eq("id", params.id)
      .select("id,email,is_active,notify_new_courses,notify_course_updates,subscribed_at,unsubscribed_at,unsubscribe_reason")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ subscriber: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
