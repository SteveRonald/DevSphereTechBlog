import { NextResponse } from "next/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, userId } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const adminEmail = process.env.CONTACT_EMAIL || process.env.RESEND_TO_EMAIL || process.env.GMAIL_USER;
    
    if (!adminEmail) {
      return NextResponse.json(
        { error: "Admin email not configured" },
        { status: 500 }
      );
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
          New User Registration
        </h2>
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
          <p style="margin: 0; font-size: 18px; color: #1e40af;">
            <strong>A new user has registered!</strong>
          </p>
        </div>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          ${userId ? `<p><strong>User ID:</strong> ${userId}</p>` : ''}
          <p><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
          <p style="color: #666; margin: 0;">
            You can view all users in your Supabase Dashboard → Authentication → Users
          </p>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          This is an automated notification from CodeCraft Academy.
        </p>
      </div>
    `;

    const textContent = `
New User Registration

A new user has registered on CodeCraft Academy!

Email: ${email}
${userId ? `User ID: ${userId}\n` : ''}
Registration Time: ${new Date().toLocaleString()}

View users in Supabase Dashboard → Authentication → Users
    `;

    // Try Resend first (primary)
    let emailSent = false;
    let emailMethod = "none";

    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || process.env.GMAIL_USER || "CodeCraft Academy <onboarding@resend.dev>",
          to: adminEmail,
          subject: "New User Registration - CodeCraft Academy",
          html: htmlContent,
          text: textContent,
        });

        if (!error && data) {
          emailSent = true;
          emailMethod = "resend";
        }
      } catch (resendError: any) {
        console.error("Resend failed, trying Gmail fallback:", resendError);
      }
    }

    // Fallback to Gmail if Resend failed or not configured
    if (!emailSent) {
      const gmailTransporter = createGmailTransporter();
      if (gmailTransporter) {
        try {
          await gmailTransporter.sendMail({
            from: `"CodeCraft Academy" <${process.env.GMAIL_USER}>`,
            to: adminEmail,
            subject: "New User Registration - CodeCraft Academy",
            html: htmlContent,
            text: textContent,
          });
          emailSent = true;
          emailMethod = "gmail";
        } catch (gmailError) {
          console.error("Gmail fallback also failed:", gmailError);
        }
      }
    }

    return NextResponse.json(
      { 
        success: emailSent, 
        message: emailSent ? "Notification sent" : "Failed to send notification",
        method: emailMethod 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
