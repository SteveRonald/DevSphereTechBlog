import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { createServerClient } from "@/lib/supabase-server";

// Create Gmail transporter (fallback)
const createGmailTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// Create Resend client (primary)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface PostData {
  title: string;
  slug: string;
  excerpt: string;
  mainImage?: {
    url?: string;
    alt?: string;
  };
  author?: {
    name?: string;
  };
  categories?: Array<{
    title?: string;
  }>;
  publishedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post } = body;

    if (!post || !post.title || !post.slug) {
      return NextResponse.json(
        { error: "Post data is required (title, slug, excerpt)" },
        { status: 400 }
      );
    }

    const supabase = createServerClient(request);
    
    // Get all active newsletter subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from("newsletter_subscriptions")
      .select("email")
      .eq("is_active", true);

    if (subscribersError) {
      throw subscribersError;
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active subscribers to notify",
        sent: 0,
        total: 0,
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    const postImage = post.mainImage?.url || "";
    const authorName = post.author?.name || "Our Team";
    const categoryName = post.categories?.[0]?.title || "Blog";
    const publishedDate = post.publishedAt 
      ? new Date(post.publishedAt).toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "long", 
          day: "numeric" 
        })
      : new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "long", 
          day: "numeric" 
        });

    // Create email content
    const subject = `📚 New Post: ${post.title}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 20px 0; text-align: center; background-color: #4f46e5;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CodeCraft Academy</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 20px; background-color: #ffffff; max-width: 600px; margin: 0 auto;">
                <div style="max-width: 560px; margin: 0 auto;">
                  <!-- Thank You Message -->
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 28px;">
                      Thank You for Subscribing! 🙏
                    </h2>
                    <p style="color: #ffffff; margin: 0; font-size: 16px; opacity: 0.95;">
                      We're excited to share our latest content with you.
                    </p>
                  </div>

                  <!-- Post Preview -->
                  <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    ${postImage ? `
                    <img src="${postImage}" alt="${post.mainImage?.alt || post.title}" style="width: 100%; height: 300px; object-fit: cover; display: block;" />
                    ` : ''}
                    <div style="padding: 30px;">
                      <div style="margin-bottom: 15px;">
                        <span style="background: #4f46e5; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; display: inline-block;">
                          ${categoryName}
                        </span>
                        <span style="color: #6b7280; font-size: 14px; margin-left: 10px;">
                          ${publishedDate}
                        </span>
                      </div>
                      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 24px; line-height: 1.3;">
                        ${post.title}
                      </h3>
                      <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                        ${post.excerpt}
                      </p>
                      <div style="display: flex; align-items: center; margin-bottom: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <div>
                          <p style="margin: 0; color: #6b7280; font-size: 14px;">Written by</p>
                          <p style="margin: 0; color: #111827; font-weight: 600; font-size: 16px;">${authorName}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Call to Action -->
                  <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${postUrl}" 
                       style="background: #4f46e5; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3); transition: all 0.3s;">
                      Read Full Article →
                    </a>
                  </div>

                  <!-- Footer -->
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; text-align: center;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                      You're receiving this because you subscribed to our newsletter.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      <a href="${siteUrl}/newsletter/unsubscribe?email={{EMAIL}}" style="color: #6b7280; text-decoration: underline;">
                        Unsubscribe
                      </a>
                    </p>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #f9fafb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} CodeCraft Academy. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const textContent = `
Thank You for Subscribing! 🙏

We're excited to share our latest content with you.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEW POST: ${post.title}

Category: ${categoryName}
Published: ${publishedDate}
Author: ${authorName}

${post.excerpt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read the full article: ${postUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're receiving this because you subscribed to our newsletter.
Unsubscribe: ${siteUrl}/newsletter/unsubscribe?email={{EMAIL}}

© ${new Date().getFullYear()} CodeCraft Academy. All rights reserved.
    `;

    // Send emails to all subscribers
    let successCount = 0;
    let failCount = 0;
    const results: Array<{ email: string; success: boolean; method?: string }> = [];

    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (subscriber: { email: string }) => {
          const email = subscriber.email;
          let emailSent = false;
          let emailMethod = "none";

          // Replace email placeholder in unsubscribe link
          const personalizedHtml = htmlContent.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(email));
          const personalizedText = textContent.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(email));

          // Try Resend first (primary)
          if (resend) {
            try {
              const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || "CodeCraft Academy <onboarding@resend.dev>",
                to: email,
                subject: subject,
                html: personalizedHtml,
                text: personalizedText,
              });

              if (!error && data) {
                emailSent = true;
                emailMethod = "resend";
                successCount++;
              }
            } catch (resendError) {
              console.error(`Resend failed for ${email}, trying Gmail fallback:`, resendError);
            }
          }

          // Fallback to Gmail if Resend failed or not configured
          if (!emailSent) {
            const gmailTransporter = createGmailTransporter();
            if (gmailTransporter) {
              try {
                await gmailTransporter.sendMail({
                  from: `"CodeCraft Academy" <${process.env.GMAIL_USER}>`,
                  to: email,
                  subject: subject,
                  html: personalizedHtml,
                  text: personalizedText,
                });
                emailSent = true;
                emailMethod = "gmail";
                successCount++;
              } catch (gmailError) {
                console.error(`Gmail fallback also failed for ${email}:`, gmailError);
                failCount++;
              }
            } else {
              failCount++;
            }
          }

          results.push({
            email,
            success: emailSent,
            method: emailMethod,
          });

          // Small delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        })
      );

      // Delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter notifications sent`,
      sent: successCount,
      failed: failCount,
      total: subscribers.length,
      results: results.slice(0, 10), // Return first 10 results for debugging
    });
  } catch (error: any) {
    console.error("Error sending newsletter notifications:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to send newsletter notifications" 
      },
      { status: 500 }
    );
  }
}

