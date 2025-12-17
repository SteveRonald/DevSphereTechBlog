import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, userAgent: clientUserAgent, ip: clientIp } = body;

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Email and userId are required" },
        { status: 400 }
      );
    }

    // Get user agent and IP from request headers or client
    const userAgent = request.headers.get("user-agent") || clientUserAgent || "Unknown";
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || clientIp || "Unknown";

    // Get device info from user agent
    const deviceInfo = userAgent.includes("Mobile") ? "Mobile Device" : 
                      userAgent.includes("Tablet") ? "Tablet" : 
                      "Desktop";

    // Check if this is a new device/location
    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("last_device, last_ip, last_signin_at")
      .eq("id", userId)
      .single();

    const isNewDevice = !profile?.last_device || profile.last_device !== deviceInfo;
    const isNewLocation = !profile?.last_ip || profile.last_ip !== ip;
    const isNewDeviceOrLocation = isNewDevice || isNewLocation;

    // Update last sign-in info
    await supabase
      .from("user_profiles")
      .update({
        last_device: deviceInfo,
        last_ip: ip,
        last_signin_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    // Email content
    const subject = isNewDeviceOrLocation 
      ? "🔐 New Sign-In from New Device/Location - CodeCraft Academy"
      : "🔐 New Sign-In Detected - CodeCraft Academy";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
          New Sign-In Detected
        </h2>
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
          <p style="margin: 0; font-size: 18px; color: #1e40af;">
            <strong>🔐 Someone just signed in to your account</strong>
          </p>
        </div>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Device:</strong> ${deviceInfo} ${isNewDevice ? '<span style="color: #dc2626;">(NEW)</span>' : ''}</p>
          <p><strong>Location:</strong> ${ip} ${isNewLocation ? '<span style="color: #dc2626;">(NEW)</span>' : ''}</p>
        </div>
        ${isNewDeviceOrLocation ? `
        <div style="background: #fff3cd; padding: 20px; border: 2px solid #ffc107; border-radius: 8px; margin: 20px 0;">
          <p style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">
            <strong>⚠️ New Device or Location Detected!</strong>
          </p>
          <p style="color: #666; margin: 0 0 15px 0;">
            We detected a sign-in from a ${isNewDevice ? 'new device' : ''}${isNewDevice && isNewLocation ? ' and ' : ''}${isNewLocation ? 'new location' : ''}. 
            For extra security, we strongly recommend enabling Two-Factor Authentication (2FA).
          </p>
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/settings" 
               style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Enable 2FA in Settings
            </a>
          </div>
        </div>
        ` : ''}
        <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
          <p style="color: #666; margin: 0 0 10px 0;">
            <strong>If this was you:</strong> No action needed. You can safely ignore this email.
          </p>
          <p style="color: #dc2626; margin: 0;">
            <strong>If this wasn't you:</strong> Please change your password immediately and contact us.
          </p>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/profile" 
             style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Account Settings
          </a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          This is an automated security notification from CodeCraft Academy.
        </p>
      </div>
    `;

    const textContent = `
New Sign-In Detected

Someone just signed in to your CodeCraft Academy account.

Time: ${new Date().toLocaleString()}
Device: ${deviceInfo}${isNewDevice ? ' (NEW)' : ''}
Location: ${ip}${isNewLocation ? ' (NEW)' : ''}

${isNewDeviceOrLocation ? `
⚠️ New Device or Location Detected!
We detected a sign-in from a ${isNewDevice ? 'new device' : ''}${isNewDevice && isNewLocation ? ' and ' : ''}${isNewLocation ? 'new location' : ''}. 
For extra security, we strongly recommend enabling Two-Factor Authentication (2FA).
Enable 2FA: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/settings
` : ''}

If this was you: No action needed.
If this wasn't you: Please change your password immediately.

View Account: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/profile
    `;

    // Try Resend first (primary)
    let emailSent = false;
    let emailMethod = "none";

    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "CodeCraft Academy <onboarding@resend.dev>",
          to: email,
          subject: subject,
          html: htmlContent,
          text: textContent,
        });

        if (!error && data) {
          emailSent = true;
          emailMethod = "resend";
        }
      } catch (resendError) {
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
            to: email,
            subject: subject,
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
        method: emailMethod,
        isNewDeviceOrLocation 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Notification error:", error);
    // Don't fail the request if notification fails
    return NextResponse.json(
      { success: false, error: "Notification failed but sign-in succeeded" },
      { status: 200 }
    );
  }
}
