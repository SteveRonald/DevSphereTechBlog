import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerClient } from "@/lib/supabase-server";
import { getWebsiteContext } from "@/lib/chat-context";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, description, sessionId, imageType } = body;

    if (!image || !sessionId) {
      return NextResponse.json(
        { error: "Image and session ID are required" },
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
    const supabase = createServerClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || null;

    // Get and validate image upload limit from environment variable (required, no fallback)
    const envLimit = process.env.DAILY_IMAGE_UPLOAD_LIMIT;
    
    if (!envLimit) {
      console.error("DAILY_IMAGE_UPLOAD_LIMIT not set in environment variables");
      return NextResponse.json(
        { error: "Image upload limit not configured. Please set DAILY_IMAGE_UPLOAD_LIMIT in your environment variables." },
        { status: 500 }
      );
    }
    
    const DAILY_IMAGE_LIMIT = parseInt(envLimit, 10);
    
    if (isNaN(DAILY_IMAGE_LIMIT) || DAILY_IMAGE_LIMIT <= 0) {
      console.error("DAILY_IMAGE_UPLOAD_LIMIT is invalid:", envLimit);
      return NextResponse.json(
        { error: "Invalid image upload limit configuration" },
        { status: 500 }
      );
    }

    // Check image upload limit for logged-in users (daily limit)
    if (userId) {
      
      // Get current usage
      const { data: usageData, error: usageError } = await supabase.rpc(
        "get_or_create_image_usage",
        {
          p_user_id: userId,
        }
      );

      if (usageError) {
        console.error("Error checking image usage:", usageError);
        // Allow on error to not break the experience
      } else {
        const usage = Array.isArray(usageData) ? (usageData[0] || { upload_count: 0 }) : (usageData || { upload_count: 0 });
        const currentCount = usage.upload_count || 0;
        
        if (currentCount >= DAILY_IMAGE_LIMIT) {
          return NextResponse.json(
            {
              error: "daily_limit_reached",
              message: `You've reached your daily image upload limit of ${DAILY_IMAGE_LIMIT} images. You can still use text or voice input to continue chatting.`,
              count: currentCount,
              limit: DAILY_IMAGE_LIMIT,
            },
            { status: 429 } // Too Many Requests
          );
        }
      }
    }

    // Get website context to help analyze if image is related
    const context = await getWebsiteContext();
    // Format website topics more clearly for the prompt
    const recentPostTitles = context.recentPosts.length > 0 
      ? context.recentPosts.map((p: any) => `"${p.title}"`).join(", ")
      : "None available";
    const categoryTitles = context.categories.length > 0
      ? context.categories.map((c: any) => c.title).join(", ")
      : "None available";
    
    const websiteTopics = `Recent Blog Posts: ${recentPostTitles}
Categories: ${categoryTitles}
General Topics: web development, programming, coding, React, Next.js, TypeScript, JavaScript, tutorials, blog posts`;

    const systemPrompt = `You are a helpful assistant for CodeCraft Academy (codecraftacademy.com), a web development blog and learning platform.

OUR WEBSITE CONTENT AND TOPICS:
${websiteTopics}

YOUR ROLE:
When analyzing images, you must:
1. **Identify if the image relates to CodeCraft Academy:**
   - Screenshots of our website (codecraftacademy.com)
   - Screenshots of our blog posts, tutorials, or courses
   - Code snippets from our tutorials
   - Issues users are having with our website features
   - Registration/login problems on our site
   - UI/UX feedback about our website

2. **Provide website-specific help:**
   - If it's a screenshot of our website, identify the page/feature and provide specific guidance
   - If it's a registration/login issue, help troubleshoot based on our actual authentication system
   - If it's code from our tutorials, reference the specific tutorial and provide context
   - If it's an error related to our content, provide solutions based on our teaching materials

3. **Be specific and actionable:**
   - Reference actual pages, features, or content from CodeCraft Academy when relevant
   - Provide step-by-step solutions based on our website's structure
   - Link to relevant blog posts or tutorials from our site when applicable
   - Avoid generic responses - always relate back to CodeCraft Academy when possible

4. **If the image is NOT related to our website:**
   - Still be helpful, but gently redirect to our website content
   - Suggest relevant tutorials or blog posts from CodeCraft Academy that might help
   - Explain that you're specialized in helping with CodeCraft Academy content

Remember: You are CodeCraft Academy's assistant. Your primary goal is to help users with our website, our content, and web development topics we cover. Always be specific, helpful, and reference our actual website when relevant.`;

    // Use Groq for text-based analysis with description (image analysis coming soon)
    const userMessage = description 
      ? `A user has uploaded an image with the following description/question: "${description}". Please analyze the image based on their description and provide helpful, actionable guidance. The image is related to CodeCraft Academy or web development.`
      : `A user has uploaded an image without a description. Please provide helpful guidance. The image is likely related to CodeCraft Academy or web development (code snippets, error messages, UI designs, website screenshots, etc.). Provide general but useful advice about what they might be seeing.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ] as any,
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || 
      (description 
        ? `Based on your description "${description}", I'd be happy to help! ${description.includes("error") || description.includes("issue") || description.includes("problem") ? "Let me help you troubleshoot this." : "What specific guidance would you like?"}`
        : `I've received your image! Based on common web development scenarios, here are some things I can help with: code debugging, error troubleshooting, UI implementation, or website features. Could you describe what you see or what you need help with?`);
    
    const modelUsed = "llama-3.1-8b-instant";

    // Save conversation to database
    let conversationId: string | null = null;
    try {
      const now = new Date();
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
      const [dateStr, timeStr] = nairobiTimeStr.split(", ");
      const [month, day, year] = dateStr.split("/");
      const nairobiTimeISO = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${timeStr}+03:00`;

      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          session_id: sessionId,
          user_id: userId,
          user_question: description ? `[Image uploaded] ${description}` : "[Image uploaded]",
          ai_response: response,
          context_used: {
            type: "image_analysis",
            image_uploaded: true,
          },
          response_time_ms: 0,
              model_used: modelUsed,
          created_at: nairobiTimeISO,
        })
        .select("id, created_at")
        .single();

      if (!error && data) {
        conversationId = data.id;
      }
    } catch (dbError) {
      console.error("Error saving image conversation:", dbError);
    }

    // Increment image upload count for logged-in users
    let imageCount = 0;
    if (userId) {
      try {
        const { data: countData, error: countError } = await supabase.rpc(
          "increment_image_upload_count",
          {
            p_user_id: userId,
          }
        );
        
        if (!countError) {
          imageCount = countData || 0;
        }
      } catch (error) {
        console.error("Error incrementing image count:", error);
      }
    }

    return NextResponse.json({
      response,
      success: true,
      conversationId,
      analysis: "Image received. Please note that full image analysis requires vision capabilities.",
      imageCount,
      imageLimit: userId ? DAILY_IMAGE_LIMIT : null,
    });
  } catch (error: any) {
    console.error("Image analysis API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to analyze image",
        success: false,
      },
      { status: 500 }
    );
  }
}

