import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase-admin";
import { getSystemSettingsRow } from "@/lib/system-settings";

type SystemSettings = {
  site_name: string | null;
  support_email: string | null;
  maintenance_mode: boolean;
  allow_new_signups: boolean;
  newsletter_enabled: boolean;
  course_notifications_enabled: boolean;
  course_update_notifications_enabled: boolean;
  featured_course_category: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const settings = await getSystemSettingsRow();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const body = (await request.json()) as Partial<SystemSettings>;

    const patch: Partial<SystemSettings> = {};
    if (typeof body.site_name === "string" || body.site_name === null) patch.site_name = body.site_name ?? null;
    if (typeof body.support_email === "string" || body.support_email === null) patch.support_email = body.support_email ?? null;
    if (typeof body.featured_course_category === "string" || body.featured_course_category === null) {
      patch.featured_course_category = body.featured_course_category ?? null;
    }
    if (typeof body.maintenance_mode === "boolean") patch.maintenance_mode = body.maintenance_mode;
    if (typeof body.allow_new_signups === "boolean") patch.allow_new_signups = body.allow_new_signups;
    if (typeof body.newsletter_enabled === "boolean") patch.newsletter_enabled = body.newsletter_enabled;
    if (typeof body.course_notifications_enabled === "boolean") {
      patch.course_notifications_enabled = body.course_notifications_enabled;
    }
    if (typeof body.course_update_notifications_enabled === "boolean") {
      patch.course_update_notifications_enabled = body.course_update_notifications_enabled;
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("system_settings")
      .upsert({ id: 1, ...patch, updated_at: new Date().toISOString() }, { onConflict: "id" })
      .select(
        "site_name,support_email,maintenance_mode,allow_new_signups,newsletter_enabled,course_notifications_enabled,course_update_notifications_enabled,featured_course_category"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ settings: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
