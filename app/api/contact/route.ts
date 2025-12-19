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
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Sanitize input to prevent XSS (basic sanitization)
    const sanitize = (str: string) => {
      return str
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
    };

    const sanitizedName = sanitize(name);
    const sanitizedSubject = sanitize(subject);
    const sanitizedMessage = sanitize(message);

    const adminEmail = process.env.CONTACT_EMAIL || process.env.RESEND_TO_EMAIL || process.env.GMAIL_USER;
    
    if (!adminEmail) {
      return NextResponse.json(
        { error: "Contact email not configured" },
        { status: 500 }
      );
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${sanitizedName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${sanitizedSubject}</p>
        </div>
        <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="color: #333; margin-top: 0;">Message:</h3>
          <p style="color: #666; line-height: 1.6; white-space: pre-wrap;">${sanitizedMessage}</p>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          This email was sent from the CodeCraft Academy contact form.
        </p>
      </div>
    `;

    const textContent = `
New Contact Form Submission

Name: ${sanitizedName}
Email: ${email}
Subject: ${sanitizedSubject}

Message:
${sanitizedMessage}
    `;

    // Try Resend first (primary)
    let emailSent = false;
    let emailMethod = "none";

    // Try Resend first (primary)
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || process.env.GMAIL_USER || "CodeCraft Academy <onboarding@resend.dev>",
          to: adminEmail,
          replyTo: email,
          subject: `Contact Form: ${sanitizedSubject}`,
          html: htmlContent,
          text: textContent,
        });

        if (!error && data) {
          emailSent = true;
          emailMethod = "resend";
          console.log("Email sent successfully via Resend");
        } else if (error) {
          console.error("Resend error:", error);
          throw error; // Trigger fallback
        }
      } catch (resendError: any) {
        console.error("Resend failed, trying Gmail fallback:", resendError);
        // Continue to Gmail fallback
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
            replyTo: email,
            subject: `Contact Form: ${sanitizedSubject}`,
            html: htmlContent,
            text: textContent,
          });
          emailSent = true;
          emailMethod = "gmail";
        } catch (gmailError) {
          console.error("Gmail fallback also failed:", gmailError);
          return NextResponse.json(
            { error: "Failed to send email. Please try again later." },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Email service not configured. Please contact support directly." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Your message has been sent successfully!",
        method: emailMethod 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

