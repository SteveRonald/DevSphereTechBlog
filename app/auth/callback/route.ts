import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const redirectTo = requestUrl.searchParams.get("redirect") || "/";

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent(error)}&redirect=${encodeURIComponent(redirectTo)}`
    );
  }

  if (code) {
    const supabase = await createServerClient(request);
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth?error=${encodeURIComponent(exchangeError.message)}&redirect=${encodeURIComponent(redirectTo)}`
      );
    }

    // Verify we have a valid session before proceeding
    if (!data.session || !data.user) {
      console.error("No session or user after code exchange");
      return NextResponse.redirect(
        `${requestUrl.origin}/auth?error=No session created&redirect=${encodeURIComponent(redirectTo)}`
      );
    }

    // Ensure user profile exists after OAuth sign-in/sign-up
    if (data.user) {
      try {
        await supabase
          .from("user_profiles")
          .upsert({
            id: data.user.id,
            email: data.user.email || "",
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
            avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "id",
          });
      } catch (profileError) {
        console.error("Error creating/updating profile:", profileError);
        // Don't fail auth if profile creation fails
      }
    }
  }

  // Prevent redirect loops - if redirecting to auth, go to home instead
  const finalRedirect = redirectTo === "/auth" ? "/" : redirectTo;
  
  // Redirect to the original destination or home
  return NextResponse.redirect(`${requestUrl.origin}${finalRedirect}`);
}

