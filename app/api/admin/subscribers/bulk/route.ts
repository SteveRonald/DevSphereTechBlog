import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase-admin";

type BulkPatch = {
  is_active?: boolean;
  notify_new_courses?: boolean;
  notify_course_updates?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const body = (await request.json()) as {
      ids?: string[];
      patch?: BulkPatch;
    };

    const ids = Array.isArray(body?.ids) ? body.ids.filter((v) => typeof v === "string") : [];
    const patchIn = (body?.patch || {}) as BulkPatch;

    if (ids.length === 0) {
      return NextResponse.json({ error: "ids is required" }, { status: 400 });
    }

    const patch: Record<string, any> = { updated_at: new Date().toISOString() };

    if (typeof patchIn.is_active === "boolean") {
      patch.is_active = patchIn.is_active;
      patch.unsubscribed_at = patchIn.is_active ? null : new Date().toISOString();
    }
    if (typeof patchIn.notify_new_courses === "boolean") {
      patch.notify_new_courses = patchIn.notify_new_courses;
    }
    if (typeof patchIn.notify_course_updates === "boolean") {
      patch.notify_course_updates = patchIn.notify_course_updates;
    }

    const allowedKeys = Object.keys(patch).filter((k) => k !== "updated_at");
    if (allowedKeys.length === 0) {
      return NextResponse.json(
        { error: "patch must include at least one boolean field" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("newsletter_subscriptions")
      .update(patch)
      .in("id", ids)
      .select("id,email,is_active,notify_new_courses,notify_course_updates,subscribed_at,unsubscribed_at,unsubscribe_reason");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ subscribers: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
