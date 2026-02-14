import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase-admin";

export type SystemSettingsRow = {
  id: number;
  site_name: string | null;
  support_email: string | null;
  maintenance_mode: boolean;
  allow_new_signups: boolean;
  newsletter_enabled: boolean;
  course_notifications_enabled: boolean;
  course_update_notifications_enabled: boolean;
  featured_course_category: string | null;
  updated_at: string | null;
};

const defaultSettings: SystemSettingsRow = {
  id: 1,
  site_name: "CodeCraft Academy",
  support_email: null,
  maintenance_mode: false,
  allow_new_signups: true,
  newsletter_enabled: true,
  course_notifications_enabled: true,
  course_update_notifications_enabled: true,
  featured_course_category: null,
  updated_at: null,
};

export async function getSystemSettingsRow(): Promise<SystemSettingsRow> {
  noStore();
  const supabase = createAdminClient();

  let { data, error } = await supabase
    .from("system_settings")
    .select(
      "id,site_name,support_email,maintenance_mode,allow_new_signups,newsletter_enabled,course_notifications_enabled,course_update_notifications_enabled,featured_course_category,updated_at"
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const { data: created, error: insertErr } = await supabase
      .from("system_settings")
      .upsert(defaultSettings, { onConflict: "id" })
      .select(
        "id,site_name,support_email,maintenance_mode,allow_new_signups,newsletter_enabled,course_notifications_enabled,course_update_notifications_enabled,featured_course_category,updated_at"
      )
      .single();

    if (insertErr || !created) {
      throw insertErr || new Error("Failed to create system settings");
    }

    data = created;
  }

  return data;
}

