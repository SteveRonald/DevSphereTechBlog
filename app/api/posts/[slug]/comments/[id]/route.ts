import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient(request);
    
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Update comment
    const { data: comment, error } = await supabase
      .from("post_comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
        is_edited: true,
      })
      .eq("id", id)
      .eq("user_id", user.id)
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

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found or unauthorized" },
        { status: 404 }
      );
    }

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
      message: "Comment updated successfully",
      comment: commentWithProfile,
    });
  } catch (error: any) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient(request);
    
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete comment
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({
      message: "Comment deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete comment" },
      { status: 500 }
    );
  }
}

