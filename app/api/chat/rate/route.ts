import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, rating } = body;

    if (!conversationId || !rating) {
      return NextResponse.json(
        { error: "Conversation ID and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("chat_conversations")
      .update({ success_rating: rating })
      .eq("id", conversationId);

    if (error) {
      console.error("Error updating rating:", error);
      return NextResponse.json(
        { error: "Failed to update rating" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Rate API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process rating" },
      { status: 500 }
    );
  }
}


