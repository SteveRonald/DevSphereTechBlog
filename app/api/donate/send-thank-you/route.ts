import { NextRequest, NextResponse } from "next/server";
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

// Send thank you email function (shared with webhook)
async function sendThankYouEmail(
  donorEmail: string,
  amount: number,
  currency: string,
  reference: string,
  isRecurring: boolean
) {
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
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com"}/blog" 
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

Explore our content: ${process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com"}/blog

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, reference, amount, currency, isRecurring } = body;

    // Validate required fields
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    if (!reference) {
      return NextResponse.json(
        { error: "Transaction reference is required" },
        { status: 400 }
      );
    }

    // Verify payment was successful by checking Paystack
    try {
      const paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const paystackData = await paystackResponse.json();

      if (!paystackData.status || paystackData.data.status !== "success") {
        return NextResponse.json(
          { error: "Payment not found or not successful" },
          { status: 400 }
        );
      }

      // Use payment data from Paystack if not provided
      const donationAmount = amount || paystackData.data.amount / 100;
      const donationCurrency = currency || paystackData.data.currency || "KES";
      const donationIsRecurring = isRecurring || 
        paystackData.data.metadata?.custom_fields?.find((f: any) => f.variable_name === "donation_type")?.value === "recurring";

      // Send thank you email
      const emailResult = await sendThankYouEmail(
        email,
        donationAmount,
        donationCurrency,
        reference,
        donationIsRecurring
      );

      if (emailResult.sent) {
        return NextResponse.json({
          success: true,
          message: "Thank you email sent successfully!",
          method: emailResult.method,
        });
      } else {
        return NextResponse.json(
          { error: "Failed to send thank you email. Please try again later." },
          { status: 500 }
        );
      }
    } catch (verifyError: any) {
      console.error("Error verifying payment:", verifyError);
      return NextResponse.json(
        { error: "Failed to verify payment. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error sending thank you email:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

