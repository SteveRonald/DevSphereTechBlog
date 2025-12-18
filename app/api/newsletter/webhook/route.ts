import { NextRequest, NextResponse } from "next/server";
import { sanityClient, urlFor } from "@/lib/sanity";
import { postBySlugQuery } from "@/lib/sanity.queries";

// Sanity webhook handler for new post publications
// Configure this URL in Sanity webhook settings: https://yourdomain.com/api/newsletter/webhook
// 
// Webhook Configuration in Sanity:
// 1. Go to Sanity Dashboard → API → Webhooks
// 2. Create new webhook
// 3. URL: https://yourdomain.com/api/newsletter/webhook
// 4. Dataset: production (or your dataset)
// 5. Trigger on: Create, Update
// 6. Filter: _type == "post" && defined(publishedAt)
// 7. Projection: { _id, _type, "slug": slug.current }
// 8. HTTP method: POST
// 9. API version: 2024-01-01
// 10. Secret (optional): Set SANITY_WEBHOOK_SECRET env var

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional but recommended)
    const webhookSecret = request.headers.get("x-sanity-secret");
    if (process.env.SANITY_WEBHOOK_SECRET && webhookSecret !== process.env.SANITY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Sanity webhook payload can be in different formats
    // Handle both direct document payload and webhook event format
    let postSlug: string | null = null;
    let postId: string | null = null;

    // Check if it's a direct document (from webhook projection)
    if (body._type === "post" && body.slug) {
      postSlug = typeof body.slug === "string" ? body.slug : body.slug.current;
      postId = body._id;
    }
    // Check if it's a webhook event format
    else if (body.projectId && body.dataset && body.documents) {
      // Multiple documents in one webhook call
      const postDoc = body.documents.find((doc: any) => doc._type === "post" && doc.slug);
      if (postDoc) {
        postSlug = typeof postDoc.slug === "string" ? postDoc.slug : postDoc.slug?.current;
        postId = postDoc._id;
      }
    }
    // Check if it's a single document update
    else if (body._id && body._type === "post") {
      postId = body._id;
      postSlug = body.slug?.current || body.slug;
    }

    // Only process if it's a post with a slug
    if (!postSlug || !postId) {
      return NextResponse.json({
        success: true,
        message: "Not a post publication, skipping",
        received: body,
      });
    }

    // Fetch full post data using the slug
    const post = await sanityClient.fetch(postBySlugQuery, { slug: postSlug });

    if (!post || !post.publishedAt) {
      return NextResponse.json({
        success: true,
        message: "Post not found or not published yet, skipping",
      });
    }

    // Format post data for notification API
    const postData = {
      title: post.title,
      slug: post.slug.current || postSlug,
      excerpt: post.excerpt || "",
      mainImage: post.mainImage
        ? {
            url: urlFor(post.mainImage).width(800).height(400).url(),
            alt: post.mainImage.alt || post.title,
          }
        : undefined,
      author: post.author
        ? {
            name: post.author.name || "Our Team",
          }
        : { name: "Our Team" },
      categories: post.categories || [],
      publishedAt: post.publishedAt || new Date().toISOString(),
    };

    // Call the notification API internally (server-to-server)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const notifyUrl = `${siteUrl}/api/newsletter/notify-new-post`;
    
    const notifyResponse = await fetch(notifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ post: postData }),
    });

    const notifyResult = await notifyResponse.json();

    if (!notifyResponse.ok) {
      throw new Error(notifyResult.error || "Failed to send notifications");
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      postSlug,
      notification: notifyResult,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to process webhook" 
      },
      { status: 500 }
    );
  }
}

// Allow GET for webhook verification
export async function GET() {
  return NextResponse.json({
    message: "Newsletter webhook endpoint",
    status: "active",
  });
}

