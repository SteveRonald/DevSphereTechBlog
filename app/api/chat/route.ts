import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase-server";
import { getWebsiteContext, formatContextForPrompt } from "@/lib/chat-context";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Chat limits configuration from environment variables
const ANONYMOUS_CHAT_LIMIT = parseInt(process.env.CHAT_ANONYMOUS_LIMIT || "10", 10);
const LOGGED_IN_UNLIMITED = process.env.CHAT_LOGGED_IN_UNLIMITED !== "false"; // Default to true

// Helper function to check chat limits
async function checkChatLimit(
  supabase: any,
  userId: string | null,
  sessionId: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  try {
    // Logged in users have unlimited access
    if (userId && LOGGED_IN_UNLIMITED) {
      return { allowed: true, count: 0, limit: Infinity };
    }

    // Check usage for anonymous users
    const { data: usageData, error: usageError } = await supabase.rpc(
      "get_or_create_chat_usage",
      {
        p_session_id: sessionId,
        p_user_id: userId,
      }
    );

    if (usageError) {
      console.error("Error checking chat usage:", usageError);
      console.error("Session ID:", sessionId, "User ID:", userId);
      // Allow on error to not break the experience
      return { allowed: true, count: 0, limit: ANONYMOUS_CHAT_LIMIT };
    }

    // get_or_create_chat_usage returns a table, so it's an array
    const usage = Array.isArray(usageData) ? (usageData[0] || { chat_count: 0 }) : (usageData || { chat_count: 0 });
    const count = usage.chat_count || 0;
    const allowed = count < ANONYMOUS_CHAT_LIMIT;
    
    console.log("Chat limit check:", { sessionId, userId, count, limit: ANONYMOUS_CHAT_LIMIT, allowed });

    return {
      allowed,
      count,
      limit: ANONYMOUS_CHAT_LIMIT,
    };
  } catch (error) {
    console.error("Error in checkChatLimit:", error);
    // Allow on error
    return { allowed: true, count: 0, limit: ANONYMOUS_CHAT_LIMIT };
  }
}

// Helper function to increment chat count
async function incrementChatCount(
  supabase: any,
  userId: string | null,
  sessionId: string
): Promise<number> {
  try {
    if (!userId) {
      // Only increment for anonymous users
      console.log("Incrementing chat count for session:", sessionId);
      const { data, error } = await supabase.rpc("increment_chat_count", {
        p_session_id: sessionId,
        p_user_id: null, // Explicitly pass null for anonymous users
      });
      
      if (error) {
        console.error("Error incrementing chat count:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return 0; // Return 0 on error
      }
      
      console.log("Increment result:", { data, type: typeof data, isArray: Array.isArray(data) });
      
      // increment_chat_count returns INTEGER directly, not an array
      const newCount = data || 0;
      console.log("New chat count:", newCount);
      return newCount;
    }
    return 0;
  } catch (error) {
    console.error("Error incrementing chat count (catch):", error);
    return 0; // Return 0 on error
  }
}

// Cache context for 5 minutes to speed up responses
let cachedContext: { context: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedContext() {
  const now = Date.now();
  if (cachedContext && (now - cachedContext.timestamp) < CACHE_DURATION) {
    return cachedContext.context;
  }
  
  const context = await getWebsiteContext();
  cachedContext = { context, timestamp: now };
  return context;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { message, conversationHistory = [], sessionId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key not configured" },
        { status: 500 }
      );
    }

    // Check authentication
    const supabase = await createServerClient(request);
    
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
          console.log("User authenticated from Authorization header, user_id:", user.id);
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
          console.error("User error in chat route:", userError);
        }
        if (sessionError) {
          console.error("Session error in chat route:", sessionError);
        }
      }
    }
    
    const userId = user?.id || null;
    
    // Log for debugging - ensure user_id is captured
    if (userId) {
      console.log("User authenticated, user_id:", userId);
    } else {
      console.log("No user authenticated (anonymous session) - hasAuthHeader:", !!authHeader);
    }

    // Check chat limits BEFORE processing
    const limitCheck = await checkChatLimit(supabase, userId, sessionId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "chat_limit_reached",
          message: `You've reached the limit of ${limitCheck.limit} free chats. Please sign in or create an account to continue chatting.`,
          count: limitCheck.count,
          limit: limitCheck.limit,
          requiresAuth: true,
        },
        { status: 429 } // Too Many Requests
      );
    }
    
    // Double-check: if count is already at or above limit, reject
    if (!userId && limitCheck.count >= limitCheck.limit) {
      return NextResponse.json(
        {
          error: "chat_limit_reached",
          message: `You've reached the limit of ${limitCheck.limit} free chats. Please sign in or create an account to continue chatting.`,
          count: limitCheck.count,
          limit: limitCheck.limit,
          requiresAuth: true,
        },
        { status: 429 }
      );
    }

    // Get website context (cached for speed)
    const context = await getCachedContext();
    
    // Get the origin from the request to use correct URLs
    let origin: string | undefined;
    try {
      // Try to get origin from request URL
      const url = new URL(request.url);
      origin = `${url.protocol}//${url.host}`;
    } catch {
      // Fallback to headers if URL parsing fails
      const host = request.headers.get("host");
      const protocol = request.headers.get("x-forwarded-proto") || 
                      (request.url.startsWith("https") ? "https" : "http");
      origin = host ? `${protocol}://${host}` : undefined;
    }
    
    const systemPrompt = formatContextForPrompt(context, origin);

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (last 5 messages for context, to keep it fast)
    const recentHistory = conversationHistory.slice(-5);
    recentHistory.forEach((msg: { role: string; content: string }) => {
      messages.push({ role: msg.role, content: msg.content });
    });

    // Add current message
    messages.push({ role: "user", content: message });

    // Use Groq's fastest model for quick responses
    // Lower temperature for more focused, consistent responses
    const completion = await groq.chat.completions.create({
      messages: messages as any,
      model: "llama-3.1-8b-instant", // Fastest model for quick responses
      temperature: 0.5, // Lower for more focused responses
      max_tokens: 400, // Keep responses concise for speed
      stream: false, // Non-streaming for faster initial response
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    const responseTime = Date.now() - startTime;

    // Save conversation to database
    let conversationId: string | null = null;
    try {
      const context = await getCachedContext();
      // Get current time in Nairobi timezone (Africa/Nairobi, UTC+3)
      // Convert UTC time to Nairobi timezone and format as ISO string
      const now = new Date();
      // Get time components in Nairobi timezone
      const nairobiTimeStr = now.toLocaleString("en-US", {
        timeZone: "Africa/Nairobi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      // Parse the formatted string: "MM/DD/YYYY, HH:mm:ss"
      const [dateStr, timeStr] = nairobiTimeStr.split(", ");
      const [month, day, year] = dateStr.split("/");
      // Format as: YYYY-MM-DDTHH:mm:ss+03:00 (Nairobi is UTC+3)
      const nairobiTimeISO = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${timeStr}+03:00`;
      
      const insertData = {
        session_id: sessionId || `session_${Date.now()}`,
        user_id: userId, // Tie conversation to logged-in user
        user_question: message,
        ai_response: response,
        context_used: {
          recent_posts: context.recentPosts.slice(0, 5).map((p: any) => p.title),
          categories: context.categories.map((c: any) => c.title),
        },
        response_time_ms: responseTime,
        model_used: "llama-3.1-8b-instant",
        created_at: nairobiTimeISO, // Saved in Nairobi timezone (UTC+3)
      };
      
      console.log("Saving conversation with data:", {
        session_id: insertData.session_id,
        user_id: insertData.user_id,
        has_user_id: !!insertData.user_id,
      });
      
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert(insertData)
        .select("id, created_at, user_id")
        .single();
        
      if (error) {
        console.error("Error saving conversation:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
      } else {
        console.log("Conversation saved successfully:", { 
          id: data?.id, 
          created_at: data?.created_at,
          user_id: data?.user_id,
          saved_user_id: data?.user_id || "NULL"
        });
      }

      if (!error && data) {
        conversationId = data.id;
      }
    } catch (dbError) {
      console.error("Error saving conversation to database:", dbError);
      // Don't fail the request if database save fails
    }

    // Increment chat count (only for anonymous users) AFTER successful processing
    let finalCount = limitCheck.count;
    if (!userId) {
      const incrementedCount = await incrementChatCount(supabase, userId, sessionId);
      if (incrementedCount > 0) {
        finalCount = incrementedCount;
      } else {
        // If increment failed, use the count from limitCheck + 1
        // This ensures the frontend shows progress even if DB update fails
        finalCount = limitCheck.count + 1;
        console.warn("Chat count increment returned 0, using fallback count:", finalCount);
      }
    }

    console.log("Returning chat response:", { 
      finalCount, 
      limit: limitCheck.limit, 
      isLoggedIn: !!userId,
      sessionId 
    });

    return NextResponse.json({
      response,
      success: true,
      conversationId,
      chatCount: finalCount,
      chatLimit: limitCheck.limit,
      isLoggedIn: !!userId,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to process chat message",
        success: false,
      },
      { status: 500 }
    );
  }
}

