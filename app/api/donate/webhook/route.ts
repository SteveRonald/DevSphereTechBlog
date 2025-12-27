import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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

// Get site URL helper
function getSiteUrl(request?: Request): string {
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  
  if (!siteUrl || siteUrl.includes("your-project") || siteUrl.includes("yourdomain") || siteUrl === "http://localhost:3000") {
    // Try to get from request headers as fallback
    if (request) {
      const host = request.headers.get("host");
      const protocol = request.headers.get("x-forwarded-proto") || "https";
      if (host && !host.includes("localhost")) {
        siteUrl = `${protocol}://${host}`;
      }
    }
    
    // Final fallback
    if (!siteUrl || siteUrl.includes("your-project") || siteUrl.includes("yourdomain")) {
      siteUrl = "https://codecraftacademy.com";
    }
  }
  
  return siteUrl;
}

// Send thank you email to donor
async function sendThankYouEmail(
  donorEmail: string,
  amount: number,
  currency: string,
  reference: string,
  isRecurring: boolean,
  request?: Request
) {
  // Skip if email is a placeholder (for KES mobile money without email)
  if (donorEmail.includes("@paystack.local") || donorEmail.includes("@example.com") || donorEmail.includes("@donation.placeholder")) {
    console.log("Skipping thank you email for placeholder email:", donorEmail);
    return { sent: false, reason: "placeholder_email" };
  }

  const siteUrl = getSiteUrl(request);
  const currencySymbol = currency === "KES" ? "KES" : "$";
  const formattedAmount = currency === "KES" 
    ? `${currencySymbol} ${amount.toLocaleString()}` 
    : `${currencySymbol}${amount.toFixed(2)}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px;">
          Thank You!
        </h1>
        <p style="color: #ffffff; margin: 0; font-size: 16px; opacity: 0.95;">
          Your support means the world to us
        </p>
      </div>

      <div style="background: #ffffff; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          We're incredibly grateful for your ${isRecurring ? "monthly " : ""}donation of <strong>${formattedAmount}</strong>!
        </p>
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          Your contribution helps us continue creating high-quality tutorials, reviews, and resources for developers worldwide. Every donation, no matter the size, makes a real difference.
        </p>
        ${isRecurring ? `
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 20px 0;">
          <p style="color: #1e40af; margin: 0; font-size: 14px;">
            <strong>Recurring Donation:</strong> Your monthly donation will continue automatically. You can manage or cancel it anytime from your account.
          </p>
        </div>
        ` : ''}
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            <strong>Transaction Reference:</strong> ${reference}
          </p>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${siteUrl}/blog" 
           style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
          Explore Our Content
        </a>
      </div>

      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
        This is an automated receipt from CodeCraft Academy.<br>
        If you have any questions, please contact us at ${process.env.CONTACT_EMAIL || "support@codecraftacademy.com"}
      </p>
    </div>
  `;

  const textContent = `
Thank You for Your Donation!

We're incredibly grateful for your ${isRecurring ? "monthly " : ""}donation of ${formattedAmount}!

Your contribution helps us continue creating high-quality tutorials, reviews, and resources for developers worldwide. Every donation, no matter the size, makes a real difference.

${isRecurring ? "Recurring Donation: Your monthly donation will continue automatically. You can manage or cancel it anytime from your account.\n\n" : ""}
Transaction Reference: ${reference}

Explore our content: ${siteUrl}/blog

This is an automated receipt from CodeCraft Academy.
If you have any questions, please contact us at ${process.env.CONTACT_EMAIL || "support@codecraftacademy.com"}
  `;

  // Try Resend first (primary)
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || process.env.GMAIL_USER || "CodeCraft Academy <onboarding@resend.dev>",
        to: donorEmail,
        subject: `Thank You for Your Donation - CodeCraft Academy`,
        html: htmlContent,
        text: textContent,
      });

      if (!error && data) {
        console.log("Thank you email sent via Resend to:", donorEmail);
        return { sent: true, method: "resend" };
      }
    } catch (resendError: any) {
      console.error("Resend failed for thank you email, trying Gmail fallback:", resendError);
    }
  }

  // Fallback to Gmail
  const gmailTransporter = createGmailTransporter();
  if (gmailTransporter) {
    try {
      await gmailTransporter.sendMail({
        from: `"CodeCraft Academy" <${process.env.GMAIL_USER}>`,
        to: donorEmail,
        subject: `Thank You for Your Donation - CodeCraft Academy`,
        html: htmlContent,
        text: textContent,
      });
      console.log("Thank you email sent via Gmail to:", donorEmail);
      return { sent: true, method: "gmail" };
    } catch (gmailError) {
      console.error("Gmail fallback also failed for thank you email:", gmailError);
      return { sent: false, method: "none", error: gmailError };
    }
  }

  return { sent: false, method: "none", reason: "no_email_service" };
}

/**
 * Paystack Webhook Handler
 * Verifies and processes payment notifications from Paystack
 * 
 * Set webhook URL in Paystack Dashboard:
 * Settings → API Keys & Webhooks → Add Webhook
 * URL: https://yourdomain.com/api/donate/webhook
 * Events: Select "charge.success" and "charge.failure"
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const secret = process.env.PAYSTACK_SECRET_KEY || "";
    const hash = crypto
      .createHmac("sha512", secret)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    // Handle different event types
    switch (event.event) {
      case "charge.success":
        // Payment was successful
        const payment = event.data;
        const amount = payment.amount / 100; // Convert from kobo/cents
        const currency = payment.currency || "KES";
        const donorEmail = payment.customer?.email || payment.authorization?.email;
        const isRecurring = payment.metadata?.custom_fields?.find((f: any) => f.variable_name === "donation_type")?.value === "recurring";
        
        console.log("Payment successful:", {
          reference: payment.reference,
          amount,
          currency,
          email: donorEmail,
          isRecurring,
          metadata: payment.metadata,
        });

        // Send thank you email ONLY if payment is successful AND email is available
        // Check payment status to ensure it's actually successful
        if (payment.status === "success" && donorEmail) {
          try {
            const emailResult = await sendThankYouEmail(
              donorEmail,
              amount,
              currency,
              payment.reference,
              isRecurring,
              request
            );
            console.log("Thank you email result:", emailResult);
          } catch (emailError) {
            console.error("Error sending thank you email:", emailError);
            // Don't fail the webhook if email fails
          }
        } else if (!donorEmail || donorEmail.includes("@paystack.local") || donorEmail.includes("@example.com")) {
          console.log("No valid email available for thank you email (likely KES mobile money without email)");
          // Mobile money users can provide email on success page
        } else if (payment.status !== "success") {
          console.log("Payment status is not success, skipping thank you email");
        }

        // Here you can also:
        // 1. Update your database
        // 2. Update user subscription status (if recurring)
        // 3. Send admin notifications

        return NextResponse.json({ 
          received: true, 
          event: "charge.success",
          emailSent: !!donorEmail 
        });

      case "charge.failure":
        // Payment failed - DO NOT send thank you email
        const failedPayment = event.data;
        console.log("Payment failed:", {
          reference: failedPayment.reference,
          reason: failedPayment.gateway_response,
        });

        // No email sent for failed payments
        return NextResponse.json({ 
          received: true, 
          event: "charge.failure",
          emailSent: false,
          reason: "Payment failed - no email sent"
        });

      case "subscription.create":
        // Recurring donation subscription created
        console.log("Subscription created:", event.data);
        return NextResponse.json({ received: true, event: "subscription.create" });

      case "subscription.disable":
        // Recurring donation cancelled
        console.log("Subscription cancelled:", event.data);
        return NextResponse.json({ received: true, event: "subscription.disable" });

      default:
        console.log("Unhandled event:", event.event);
        return NextResponse.json({ received: true, event: event.event });
    }
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Allow GET for webhook verification/testing
export async function GET() {
  return NextResponse.json({
    message: "Paystack webhook endpoint",
    status: "active",
    instructions: "Configure this URL in Paystack Dashboard: Settings → API Keys & Webhooks",
  });
}

