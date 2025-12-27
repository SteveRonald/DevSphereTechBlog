import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase-admin";

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

type CourseData = {
  id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  thumbnail_url?: string | null;
  category?: string | null;
  difficulty_level?: string | null;
  created_at?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { course } = body as { course?: CourseData };

    if (!course || !course.title || !course.slug) {
      return NextResponse.json(
        { error: "Course data is required (title, slug)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check global toggle
    const { data: settings, error: settingsError } = await admin
      .from("system_settings")
      .select("course_notifications_enabled")
      .eq("id", 1)
      .single();

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 400 });
    }

    if (!settings?.course_notifications_enabled) {
      return NextResponse.json({
        success: true,
        message: "Course notifications are disabled",
        sent: 0,
        total: 0,
      });
    }

    // Get all active subscribers who opted in
    const { data: subscribers, error: subscribersError } = await admin
      .from("newsletter_subscriptions")
      .select("email")
      .eq("is_active", true)
      .eq("notify_new_courses", true);

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

    // Get site URL - ensure it's not a placeholder
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
    if (!siteUrl || siteUrl.includes("your-project") || siteUrl.includes("yourdomain") || siteUrl === "http://localhost:3000") {
      // Try to get from request headers as fallback
      const host = request.headers.get("host");
      const protocol = request.headers.get("x-forwarded-proto") || "https";
      if (host && !host.includes("localhost")) {
        siteUrl = `${protocol}://${host}`;
      } else {
        siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://codecraftacademy.com";
      }
    }
    
    const courseUrl = `${siteUrl}/courses/${course.slug}`;
    
    // Ensure thumbnail URL is absolute
    let courseImage = course.thumbnail_url || "";
    if (courseImage && !courseImage.startsWith("http")) {
      // If relative URL, make it absolute
      if (courseImage.startsWith("/")) {
        courseImage = `${siteUrl}${courseImage}`;
      } else {
        courseImage = `${siteUrl}/${courseImage}`;
      }
    }
    
    const categoryName = course.category || "Course";
    const difficulty = course.difficulty_level || "";

    const subject = `New Course: ${course.title} - CodeCraft Academy`;

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
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 26px;">A new course is live!</h2>
                    <p style="color: #ffffff; margin: 0; font-size: 16px; opacity: 0.95;">We just published a new course on CodeCraft Academy.</p>
                  </div>

                  <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    ${courseImage ? `
                      <div style="width: 100%; max-width: 100%; background-color: #f3f4f6; text-align: center; padding: 0; margin: 0;">
                        <img src="${courseImage}" alt="${course.title}" style="max-width: 100%; width: 100%; height: auto; max-height: 300px; object-fit: contain; display: block; margin: 0 auto;" />
                      </div>
                    ` : ""}
                    <div style="padding: 30px;">
                      <div style="margin-bottom: 15px;">
                        <span style="background: #4f46e5; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; display: inline-block;">
                          ${categoryName}
                        </span>
                        ${difficulty ? `
                          <span style="color: #6b7280; font-size: 14px; margin-left: 10px;">${difficulty}</span>
                        ` : ""}
                      </div>
                      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 24px; line-height: 1.3;">${course.title}</h3>
                      <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                        ${course.short_description || "Start learning today with our newest course."}
                      </p>
                    </div>
                  </div>

                  <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${courseUrl}" 
                       style="background: #4f46e5; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">
                      View Course →
                    </a>
                  </div>

                  <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; text-align: center;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">You're receiving this because you subscribed to course updates.</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      <a href="${siteUrl}/newsletter/unsubscribe?email={{EMAIL}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
                    </p>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #f9fafb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} CodeCraft Academy. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const textContent = `
New course published: ${course.title}

${course.short_description || "Start learning today with our newest course."}

View course: ${courseUrl}

You're receiving this because you subscribed to course updates.
Unsubscribe: ${siteUrl}/newsletter/unsubscribe?email={{EMAIL}}
    `;

    let successCount = 0;
    let failCount = 0;
    const results: Array<{ email: string; success: boolean; method?: string }> = [];

    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (subscriber: { email: string }) => {
          const email = subscriber.email;
          let emailSent = false;
          let emailMethod = "none";

          const personalizedHtml = htmlContent.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(email));
          const personalizedText = textContent.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(email));

          if (resend) {
            try {
              const { data, error } = await resend.emails.send({
                from:
                  process.env.RESEND_FROM_EMAIL ||
                  process.env.GMAIL_USER ||
                  "CodeCraft Academy <onboarding@resend.dev>",
                to: email,
                subject,
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

          if (!emailSent) {
            const gmailTransporter = createGmailTransporter();
            if (gmailTransporter) {
              try {
                await gmailTransporter.sendMail({
                  from: `"CodeCraft Academy" <${process.env.GMAIL_USER}>`,
                  to: email,
                  subject,
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

          results.push({ email, success: emailSent, method: emailMethod });
          await new Promise((resolve) => setTimeout(resolve, 100));
        })
      );

      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Course notifications sent",
      sent: successCount,
      failed: failCount,
      total: subscribers.length,
      results: results.slice(0, 10),
    });
  } catch (error: any) {
    console.error("Error sending course notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send course notifications",
      },
      { status: 500 }
    );
  }
}
