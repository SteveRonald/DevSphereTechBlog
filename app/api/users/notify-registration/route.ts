import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const adminEmail = process.env.CONTACT_EMAIL || process.env.RESEND_TO_EMAIL || "your-email@gmail.com";

    // Send notification email to admin
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "CodeCraft Academy <onboarding@resend.dev>",
      to: adminEmail,
      subject: "🎉 New User Registration - CodeCraft Academy",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
            New User Registration
          </h2>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
            <p style="margin: 0; font-size: 18px; color: #1e40af;">
              <strong>🎉 A new user has registered!</strong>
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
      `,
      text: `
New User Registration

A new user has registered on CodeCraft Academy!

Email: ${email}
${userId ? `User ID: ${userId}\n` : ''}
Registration Time: ${new Date().toLocaleString()}

View users in Supabase Dashboard → Authentication → Users
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send notification email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Notification sent" },
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

