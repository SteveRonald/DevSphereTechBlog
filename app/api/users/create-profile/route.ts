import { createServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, first_name, last_name, display_name } = body;

    // Create or update user profile
    // Use service role key to bypass RLS if needed
    const { error } = await supabase
      .from("user_profiles")
      .upsert({
        id: user.id,
        email: email || user.email || "",
        first_name: first_name || null,
        last_name: last_name || null,
        display_name: display_name || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "id",
      });

    if (error) {
      console.error("Error creating profile:", error);
      // Try with raw SQL if RLS is blocking
      if (error.code === "42501" || error.message.includes("permission")) {
        try {
          await supabase.rpc('create_user_profile', {
            user_id: user.id,
            user_email: email || user.email || ""
          });
        } catch (rpcError) {
          console.error("RPC also failed:", rpcError);
        }
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user_id: user.id });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

