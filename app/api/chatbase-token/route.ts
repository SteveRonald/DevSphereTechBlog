import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const secret = process.env.CHATBOT_IDENTITY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Chatbot identity secret not configured" },
        { status: 500 }
      );
    }

    const supabase = await createServerClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        user_id: user.id,
        email: user.email,
      },
      secret,
      { expiresIn: "1h" }
    );

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error("Chatbase token error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate token" },
      { status: 500 }
    );
  }
}
