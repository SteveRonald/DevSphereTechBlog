import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase-admin";
import { getSystemSettings } from "@/lib/email-helpers";

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
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const body = await request.json();
    const { course } = body as { course?: CourseData };

    if (!course || !course.title || !course.slug) {
      return NextResponse.json(
        { error: "Course data is required (title, slug)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check system settings
    const settings = await getSystemSettings();
    if (!settings?.course_notifications_enabled) {
      return NextResponse.json({
        success: true,
        message: "Course notifications are disabled",
        sent: 0,
        total: 0,
      });
    }

    // Get all enrolled students for this course
    const { data: enrollments, error: enrollmentsError } = await admin
      .from("user_course_enrollments")
      .select("user_id, user_profiles(email, full_name)")
      .eq("course_id", courseId);

    if (enrollmentsError) {
      return NextResponse.json(
        { error: enrollmentsError.message },
        { status: 400 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No enrolled students to notify",
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

    const courseUrl = `${siteUrl}/courses/${course.slug}/learn`;
    
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

    const subject = `${course.title} is Now Available - CodeCraft Academy`;

    let sentCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    const batchSize = 10;
    for (let i = 0; i < enrollments.length; i += batchSize) {
      const batch = enrollments.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (enrollment: any) => {
          const profile = enrollment.user_profiles as { email?: string; full_name?: string } | null;
          if (!profile?.email) return;

          const userName = profile.full_name || "Student";
          let emailSent = false;

          const html = `
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
                          <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 26px;">Great News! ${course.title} is Now Available</h2>
                          <p style="color: #ffffff; margin: 0; font-size: 16px; opacity: 0.95;">The course you enrolled in is now live!</p>
                        </div>

                        <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                          ${courseImage ? `
                            <div style="width: 100%; max-width: 100%; background-color: #f3f4f6; text-align: center; padding: 0; margin: 0;">
                              <img src="${courseImage}" alt="${course.title}" style="max-width: 100%; width: 100%; height: auto; max-height: 300px; object-fit: contain; display: block; margin: 0 auto;" />
                            </div>
                          ` : ""}
                          <div style="padding: 30px;">
                            <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 24px; line-height: 1.3;">${course.title}</h3>
                            <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                              Hi ${userName},<br><br>
                              We're excited to let you know that <strong>${course.title}</strong> has been published and is now available for you to start learning!<br><br>
                              Since you're already enrolled, you can jump right in and continue your learning journey.
                              ${course.short_description ? `<br><br>${course.short_description}` : ""}
                            </p>
                          </div>
                        </div>

                        <div style="text-align: center; margin-bottom: 30px;">
                          <a href="${courseUrl}" 
                             style="background: #4f46e5; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">
                            Start Learning Now →
                          </a>
                        </div>

                        <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; text-align: center;">
                          <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            Happy learning!<br>
                            The CodeCraft Academy Team
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

          const text = `Great News! ${course.title} is Now Available

Hi ${userName},

We're excited to let you know that ${course.title} has been published and is now available for you to start learning!

Since you're already enrolled, you can jump right in and continue your learning journey.

${course.short_description ? `${course.short_description}\n\n` : ""}Start learning now: ${courseUrl}

Happy learning!
The CodeCraft Academy Team`;

          const from =
            process.env.RESEND_FROM_EMAIL ||
            (process.env.GMAIL_USER ? `CodeCraft Academy <${process.env.GMAIL_USER}>` : "CodeCraft Academy <onboarding@resend.dev>");

          // Try Resend first
          if (resend) {
            try {
              const { data, error } = await resend.emails.send({
                from,
                to: profile.email,
                subject,
                html,
                text,
              });

              if (!error && data) {
                emailSent = true;
                sentCount++;
              }
            } catch (resendError) {
              console.error(`Resend failed for ${profile.email}, trying Gmail fallback:`, resendError);
            }
          }

          // Fallback to Gmail
          if (!emailSent) {
            const gmailTransporter = createGmailTransporter();
            if (gmailTransporter) {
              try {
                await gmailTransporter.sendMail({
                  from: `"CodeCraft Academy" <${process.env.GMAIL_USER}>`,
                  to: profile.email,
                  subject,
                  html,
                  text,
                });
                emailSent = true;
                sentCount++;
              } catch (gmailError) {
                console.error(`Gmail fallback also failed for ${profile.email}:`, gmailError);
                failCount++;
                errors.push(`Failed to send to ${profile.email}`);
              }
            } else {
              failCount++;
              errors.push(`No email service available for ${profile.email}`);
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        })
      );

      if (i + batchSize < enrollments.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notifications sent to ${sentCount} enrolled students`,
      sent: sentCount,
      failed: failCount,
      total: enrollments.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error: any) {
    console.error("Error notifying enrolled students:", error);
    return NextResponse.json(
      { error: error.message || "Failed to notify enrolled students" },
      { status: 500 }
    );
  }
}

