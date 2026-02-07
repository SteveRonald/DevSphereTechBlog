import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createServerClient(request);
    
    const body = await request.json();
    const { platform } = body; // 'twitter', 'facebook', 'linkedin', 'copy', etc.

    // Get user if authenticated (shares can be anonymous)
    // Try getSession first, if that fails try getUser (which uses Authorization header)
    let user;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      user = session.user;
    } else {
      const { data: { user: userFromToken } } = await supabase.auth.getUser();
      if (userFromToken) {
        user = userFromToken;
      } else {
        // Try to get user directly from Authorization header
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
              headers: {
                "Authorization": `Bearer ${token}`,
                "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              },
            });
            if (response.ok) {
              user = await response.json();
            }
          } catch (error) {
            console.error("Error validating token:", error);
          }
        }
      }
    }

    // Record share - always include user_id if authenticated
    const shareData: {
      user_id: string | null;
      post_slug: string;
      platform: string;
    } = {
      user_id: user?.id || null,
      post_slug: slug,
      platform: platform || "copy",
    };

    const { error } = await supabase
      .from("post_shares")
      .insert(shareData);

    if (error) throw error;

    // Get updated count
    const { count } = await supabase
      .from("post_shares")
      .select("*", { count: "exact", head: true })
      .eq("post_slug", slug);

    return NextResponse.json({
      message: "Share recorded successfully",
      count: count || 0,
    });
  } catch (error: any) {
    console.error("Error recording share:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record share" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createServerClient(request);
    
    // Get total shares count
    const { count, error: countError } = await supabase
      .from("post_shares")
      .select("*", { count: "exact", head: true })
      .eq("post_slug", slug);

    if (countError) throw countError;

    return NextResponse.json({
      count: count || 0,
    });
  } catch (error: any) {
    console.error("Error fetching shares:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch shares" },
      { status: 500 }
    );
  }
}

