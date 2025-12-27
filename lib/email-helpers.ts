import { createAdminClient } from "./supabase-admin";

type SystemSettings = {
  course_notifications_enabled: boolean;
  course_update_notifications_enabled: boolean;
  newsletter_enabled: boolean;
};

let cachedSettings: SystemSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

export async function getSystemSettings(): Promise<SystemSettings | null> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("system_settings")
      .select("course_notifications_enabled,course_update_notifications_enabled,newsletter_enabled")
      .eq("id", 1)
      .single();

    if (error || !data) {
      // Return default settings if error (enable notifications by default)
      return {
        course_notifications_enabled: true,
        course_update_notifications_enabled: true,
        newsletter_enabled: true,
      };
    }

    cachedSettings = {
      course_notifications_enabled: data.course_notifications_enabled ?? true,
      course_update_notifications_enabled: data.course_update_notifications_enabled ?? true,
      newsletter_enabled: data.newsletter_enabled ?? true,
    };
    cacheTimestamp = now;
    
    return cachedSettings;
  } catch {
    // Return default settings on error
    return {
      course_notifications_enabled: true,
      course_update_notifications_enabled: true,
      newsletter_enabled: true,
    };
  }
}

export async function shouldSendReviewNotification(): Promise<boolean> {
  // Review notifications are always enabled (no specific toggle for this)
  // But we can check newsletter_enabled as a general email toggle
  const settings = await getSystemSettings();
  return settings?.newsletter_enabled ?? true;
}

