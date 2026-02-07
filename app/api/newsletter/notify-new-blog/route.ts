import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase-admin";

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

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

type BlogData = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  main_image_url?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blog }: { blog: BlogData } = body;

    if (!blog || !blog.slug) {
      return NextResponse.json({ error: "Blog data is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check if blog notifications are globally enabled
    const { data: settings } = await admin
      .from("system_settings")
      .select("blog_notifications_enabled")
      .single();

    if (settings && !settings.blog_notifications_enabled) {
      return NextResponse.json({
        success: true,
        message: "Blog notifications are globally disabled",
        sent: 0,
        total: 0,
      });
    }

    // Get subscribers who opted in for blog notifications
    const { data: subscribers, error: subscribersError } = await admin
      .from("newsletter_subscriptions")
      .select("email")
      .eq("is_active", true)
      .eq("notify_new_blogs", true);

    if (subscribersError) {
      return NextResponse.json({ error: subscribersError.message }, { status: 400 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No eligible subscribers to notify",
        sent: 0,
        total: 0,
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const blogUrl = `${siteUrl}/blog/${blog.slug}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📝 New Blog Post!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            ${blog.main_image_url ? `
              <div style="margin-bottom: 30px;">
                <img src="${blog.main_image_url}" alt="${blog.title}" style="width: 100%; height: auto; border-radius: 8px; display: block;" />
              </div>
            ` : ''}
            
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 24px;">${blog.title}</h2>
            
            ${blog.excerpt ? `
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                ${blog.excerpt}
              </p>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${blogUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Read Full Post →
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">You're receiving this because you subscribed to blog post notifications.</p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                <a href="${siteUrl}/newsletter/unsubscribe?email={{EMAIL}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
New Blog Post on CodeCraft Academy!

${blog.title}

${blog.excerpt || ''}

Read the full post: ${blogUrl}

You're receiving this because you subscribed to blog post notifications.
Unsubscribe: ${siteUrl}/newsletter/unsubscribe?email={{EMAIL}}
    `;

    let successCount = 0;
    let failCount = 0;

    for (const subscriber of subscribers) {
      const personalizedHtml = htmlContent.replace(/{{EMAIL}}/g, encodeURIComponent(subscriber.email));
      const personalizedText = textContent.replace(/{{EMAIL}}/g, encodeURIComponent(subscriber.email));

      let sent = false;

      // Try Resend first
      if (resend) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "CodeCraft Academy <onboarding@resend.dev>",
            to: subscriber.email,
            subject: `New Blog Post: ${blog.title}`,
            html: personalizedHtml,
            text: personalizedText,
          });
          sent = true;
        } catch (error) {
          console.error(`Resend failed for ${subscriber.email}:`, error);
        }
      }

      // Fallback to Gmail
      if (!sent) {
        const gmailTransporter = createGmailTransporter();
        if (gmailTransporter) {
          try {
            await gmailTransporter.sendMail({
              from: `"CodeCraft Academy" <${process.env.GMAIL_USER}>`,
              to: subscriber.email,
              subject: `New Blog Post: ${blog.title}`,
              html: personalizedHtml,
              text: personalizedText,
            });
            sent = true;
          } catch (error) {
            console.error(`Gmail failed for ${subscriber.email}:`, error);
          }
        }
      }

      if (sent) {
        successCount++;
      } else {
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notifications sent to ${successCount} subscribers`,
      sent: successCount,
      failed: failCount,
      total: subscribers.length,
    });
  } catch (error: any) {
    console.error("Error sending blog notifications:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
