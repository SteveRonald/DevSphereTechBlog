import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient(request);
    
    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from("system_settings")
      .select("id")
      .eq("id", 1)
      .maybeSingle();
    
    if (existingSettings) {
      return NextResponse.json({ 
        message: "System settings already exist",
        settings: existingSettings 
      });
    }
    
    // Insert default settings
    const { data: settings, error } = await supabase
      .from("system_settings")
      .insert({
        id: 1,
        site_name: "CodeCraft Academy",
        maintenance_mode: false,
        allow_new_signups: true,
        newsletter_enabled: true,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating system settings:", error);
      return NextResponse.json(
        { error: "Failed to create system settings" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      message: "System settings initialized successfully",
      settings 
    });
  } catch (error) {
    console.error("Init system settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
