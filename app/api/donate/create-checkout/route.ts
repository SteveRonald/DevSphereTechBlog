import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, isRecurring, email, currency } = body;

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Validate currency first
    if (!currency || (currency !== "KES" && currency !== "USD")) {
      return NextResponse.json(
        { error: "Invalid currency. Please select KES or USD" },
        { status: 400 }
      );
    }
    const validCurrency = currency;

    // Email is required for USD (bank transfers)
    // For KES (mobile money), Paystack requires email in API but uses phone number for payment
    // Generate a valid email format for KES if not provided
    let emailToUse = email;
    if (!emailToUse) {
      if (validCurrency === "USD") {
        return NextResponse.json(
          { error: "Email is required for USD payments" },
          { status: 400 }
        );
      }
      // For KES mobile money, Paystack API requires email but it's not used for payment
      // Use a valid email format - Paystack will collect phone number on their payment page
      // Format: mobile-{timestamp}@paystack.local (valid format that Paystack accepts)
      emailToUse = `mobile-${Date.now()}@paystack.local`;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    // Convert amount to smallest unit (kobo for NGN, cents for USD/KES)
    const amountInSmallestUnit = Math.round(amount * 100);
    
    // Generate unique reference
    const reference = `donation_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create Paystack transaction initialization
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailToUse, // Required by Paystack API (placeholder for KES if not provided)
        amount: amountInSmallestUnit,
        currency: validCurrency,
        reference: reference,
        callback_url: `${siteUrl}/donate/success?reference=${reference}`,
        metadata: {
          custom_fields: [
            {
              display_name: "Donation Type",
              variable_name: "donation_type",
              value: isRecurring ? "recurring" : "one_time",
            },
            {
              display_name: "Amount",
              variable_name: "amount",
              value: amount.toString(),
            },
            {
              display_name: "Currency",
              variable_name: "currency",
              value: validCurrency,
            },
          ],
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error(paystackData.message || "Failed to initialize Paystack transaction");
    }

    return NextResponse.json({
      authorizationUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference: paystackData.data.reference,
    });
  } catch (error: any) {
    console.error("Error creating Paystack transaction:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment session" },
      { status: 500 }
    );
  }
}
