import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// GET: Fetch conversation history for logged-in users
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(request);
    
    // Try to get user - check Authorization header first, then session
    let user;
    const authHeader = request.headers.get("authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Token is in header - validate it directly
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
          console.log("User authenticated from Authorization header:", user.id);
        } else {
          console.error("Token validation failed:", response.status);
        }
      } catch (error) {
        console.error("Error validating token:", error);
      }
    }
    
    // Fallback to Supabase client methods
    if (!user) {
      const { data: { user: userFromToken }, error: userError } = await supabase.auth.getUser();
      if (userFromToken) {
        user = userFromToken;
      } else {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session?.user) {
          user = session.user;
        }
        
        if (userError) {
          console.error("User error:", userError);
        }
        if (sessionError) {
          console.error("Session error:", sessionError);
        }
      }
    }

    if (!user) {
      console.error("No user found - hasAuthHeader:", !!authHeader);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log("User authenticated for conversations:", user.id);

    // Fetch conversations grouped by session_id, ordered by most recent
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("id, session_id, user_question, ai_response, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      );
    }

    // Group conversations by session_id
    const groupedConversations: Record<string, any[]> = {};
    data?.forEach((conv) => {
      if (!groupedConversations[conv.session_id]) {
        groupedConversations[conv.session_id] = [];
      }
      groupedConversations[conv.session_id].push(conv);
    });

    // Convert to array and sort by most recent conversation in each session
    const sessions = Object.entries(groupedConversations).map(([sessionId, conversations]) => {
      const sorted = conversations.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return {
        sessionId,
        conversations: sorted,
        lastMessageAt: sorted[0].created_at,
        preview: sorted[0].user_question.substring(0, 100),
      };
    });

    // Sort sessions by most recent
    sessions.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Conversations API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

