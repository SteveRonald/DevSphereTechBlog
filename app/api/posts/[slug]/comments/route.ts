import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createServerClient(request);
    
    // Get all comments for this post
    const { data: comments, error } = await supabase
      .from("post_comments")
      .select(`
        id,
        content,
        parent_id,
        created_at,
        updated_at,
        is_edited,
        user_id
      `)
      .eq("post_slug", slug)
      .order("created_at", { ascending: true });

    // Fetch user profiles separately
    interface CommentRow {
      id: string;
      content: string;
      parent_id: string | null;
      created_at: string;
      updated_at: string;
      is_edited: boolean;
      user_id: string | null;
    }
    
    const commentsWithProfiles = await Promise.all(
      (comments || []).map(async (comment: CommentRow) => {
        if (!comment.user_id) {
          return {
            ...comment,
            user_profiles: null,
          };
        }
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("display_name, email, avatar_url")
          .eq("id", comment.user_id)
          .single();
        return {
          ...comment,
          user_profiles: profile || null,
        };
      })
    );

    if (error) throw error;

    // Get count
    const { count } = await supabase
      .from("post_comments")
      .select("*", { count: "exact", head: true })
      .eq("post_slug", slug);

    return NextResponse.json({
      comments: commentsWithProfiles || [],
      count: count || 0,
    });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch comments" },
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

    const body = await request.json();
    const { content, parent_id } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from("post_comments")
      .insert({
        user_id: user.id,
        post_slug: slug,
        content: content.trim(),
        parent_id: parent_id || null,
      })
      .select(`
        id,
        content,
        parent_id,
        created_at,
        updated_at,
        is_edited,
        user_id
      `)
      .single();

    if (error) throw error;

    // Fetch user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name, email, avatar_url")
      .eq("id", user.id)
      .single();

    const commentWithProfile = {
      ...comment,
      user_profiles: profile || null,
    };

    return NextResponse.json({
      message: "Comment added successfully",
      comment: commentWithProfile,
    });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create comment" },
      { status: 500 }
    );
  }
}
