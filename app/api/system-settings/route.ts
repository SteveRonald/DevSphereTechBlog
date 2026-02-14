import { NextRequest, NextResponse } from "next/server";
import { getSystemSettingsRow } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const settings = await getSystemSettingsRow();
    return NextResponse.json(
      { maintenance_mode: settings.maintenance_mode ?? false },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" } }
    );
  } catch (error) {
    console.error("System settings error:", error);
    return NextResponse.json({ maintenance_mode: false });
  }
}
