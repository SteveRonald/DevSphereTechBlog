import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createServerClient(request);
    
    // Get total saves count
    const { count, error: countError } = await supabase
      .from("post_saves")
      .select("*", { count: "exact", head: true })
      .eq("post_slug", slug);

    if (countError) throw countError;

    // Check if current user has saved this post
    // Try getSession first, if that fails try getUser (which uses Authorization header)
    let user;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      user = session.user;
    } else {
      const { data: { user: userFromToken } } = await supabase.auth.getUser();
      user = userFromToken;
    }
    
    let userSaved = false;
    if (user) {
      const { data: save } = await supabase
        .from("post_saves")
        .select("id")
        .eq("post_slug", slug)
        .eq("user_id", user.id)
        .single();

      userSaved = !!save;
    }

    return NextResponse.json({
      count: count || 0,
      userSaved,
    });
  } catch (error: any) {
    console.error("Error fetching saves:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch saves" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createServerClient(request);
    
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
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if already saved
    const { data: existingSave } = await supabase
      .from("post_saves")
      .select("id")
      .eq("post_slug", slug)
      .eq("user_id", user.id)
      .single();

    if (existingSave) {
      return NextResponse.json({ message: "Already saved" });
    }

    // Add save
    const { error } = await supabase
      .from("post_saves")
      .insert({
        user_id: user.id,
        post_slug: slug,
      });

    if (error) throw error;

    // Get updated count
    const { count } = await supabase
      .from("post_saves")
      .select("*", { count: "exact", head: true })
      .eq("post_slug", slug);

    return NextResponse.json({
      message: "Saved successfully",
      count: count || 0,
      userSaved: true,
    });
  } catch (error: any) {
    console.error("Error saving post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createServerClient(request);
    
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
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Remove save
    const { error } = await supabase
      .from("post_saves")
      .delete()
      .eq("post_slug", slug)
      .eq("user_id", user.id);

    if (error) throw error;

    // Get updated count
    const { count } = await supabase
      .from("post_saves")
      .select("*", { count: "exact", head: true })
      .eq("post_slug", slug);

    return NextResponse.json({
      message: "Unsaved successfully",
      count: count || 0,
      userSaved: false,
    });
  } catch (error: any) {
    console.error("Error unsaving post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unsave post" },
      { status: 500 }
    );
  }
}

