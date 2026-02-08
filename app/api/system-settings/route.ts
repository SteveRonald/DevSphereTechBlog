import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Try to fetch existing settings
    let { data: settings, error } = await supabase
      .from("system_settings")
      .select("maintenance_mode")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching system settings:", error);
      return NextResponse.json({ maintenance_mode: false });
    }

    // Auto-create the row if it doesn't exist
    if (!settings) {
      console.log("No system settings row found — creating default row");
      const { data: created, error: insertErr } = await supabase
        .from("system_settings")
        .upsert(
          { id: 1, site_name: "CodeCraft Academy", maintenance_mode: false, allow_new_signups: true, newsletter_enabled: true },
          { onConflict: "id" }
        )
        .select("maintenance_mode")
        .single();

      if (insertErr) {
        console.error("Error creating default system settings:", insertErr);
        return NextResponse.json({ maintenance_mode: false });
      }

      settings = created;
    }

    console.log("System settings response:", { maintenance_mode: settings?.maintenance_mode });
    return NextResponse.json({
      maintenance_mode: settings?.maintenance_mode ?? false,
    });
  } catch (error) {
    console.error("System settings error:", error);
    return NextResponse.json({ maintenance_mode: false });
  }
}
