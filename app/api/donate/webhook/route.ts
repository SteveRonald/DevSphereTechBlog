import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
        console.log("Payment successful:", {
          reference: payment.reference,
          amount: payment.amount / 100, // Convert from kobo/cents
          currency: payment.currency,
          email: payment.customer.email,
          metadata: payment.metadata,
        });

        // Here you can:
        // 1. Update your database
        // 2. Send confirmation emails
        // 3. Update user subscription status (if recurring)
        // 4. Send notifications

        // Example: You could save to a donations table
        // await saveDonation({
        //   reference: payment.reference,
        //   amount: payment.amount / 100,
        //   email: payment.customer.email,
        //   type: payment.metadata?.custom_fields?.find(f => f.variable_name === "donation_type")?.value,
        //   status: "completed",
        //   paidAt: payment.paid_at,
        // });

        return NextResponse.json({ received: true, event: "charge.success" });

      case "charge.failure":
        // Payment failed
        const failedPayment = event.data;
        console.log("Payment failed:", {
          reference: failedPayment.reference,
          reason: failedPayment.gateway_response,
        });

        return NextResponse.json({ received: true, event: "charge.failure" });

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

