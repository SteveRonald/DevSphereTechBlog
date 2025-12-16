import { createServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect") || "/";

  if (code) {
    const supabase = createServerClient();
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent(error.message)}`);
    }

    // Ensure user profile exists after email confirmation
    if (data.user) {
      try {
        await supabase
          .from("user_profiles")
          .upsert({
            id: data.user.id,
            email: data.user.email || "",
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "id",
          });
      } catch (profileError) {
        console.error("Error creating profile:", profileError);
        // Don't fail auth if profile creation fails
      }
    }
  }

  // Redirect to the original destination or home
  return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);
}

