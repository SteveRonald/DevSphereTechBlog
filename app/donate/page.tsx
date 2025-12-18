"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Heart, Sparkles, Coffee, Gift, DollarSign, CheckCircle2, Smartphone, HandHeart, CreditCard, Shield, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Preset amounts for different currencies
const presetAmountsKES = [
  { amount: 100, label: "Coffee", icon: Coffee, description: "Buy us a coffee" },
  { amount: 500, label: "Support", icon: Heart, description: "Show your support" },
  { amount: 1000, label: "Boost", icon: Sparkles, description: "Boost our content" },
  { amount: 2500, label: "Champion", icon: Gift, description: "Become a champion" },
];

const presetAmountsUSD = [
  { amount: 5, label: "Coffee", icon: Coffee, description: "Buy us a coffee" },
  { amount: 10, label: "Support", icon: Heart, description: "Show your support" },
  { amount: 25, label: "Boost", icon: Sparkles, description: "Boost our content" },
  { amount: 50, label: "Champion", icon: Gift, description: "Become a champion" },
];

export default function DonatePage() {
  const [currency, setCurrency] = useState<"KES" | "USD">("KES");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  // Get preset amounts based on selected currency
  const presetAmounts = currency === "KES" ? presetAmountsKES : presetAmountsUSD;
  const currencySymbol = currency === "KES" ? "KES" : "$";

  const handleDonate = async () => {
    const amount = selectedAmount || parseFloat(customAmount);

    if (!amount || amount < 1) {
      toast({
        title: "Invalid amount",
        description: "Please select or enter a valid donation amount (minimum 1)",
        variant: "destructive",
      });
      return;
    }

    if (amount > 10000) {
      toast({
        title: "Amount too high",
        description: "Maximum donation amount is 10,000",
        variant: "destructive",
      });
      return;
    }

    // Email is required for USD, optional for KES (Paystack collects phone number for mobile money)
    if (currency === "USD" && (!email || !email.includes("@"))) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address for your receipt",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/donate/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          isRecurring,
          email: currency === "USD" ? email : undefined, // Only send email for USD
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Paystack Checkout
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Donation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process donation. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12 md:py-16">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Support CodeCraft Academy
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your support helps us create more high-quality tutorials, reviews, and resources for developers worldwide.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500 fill-red-500/20" />
              Why Support Us?
            </CardTitle>
            <CardDescription>
              Your donations help us maintain and improve our content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0 fill-green-500/20" />
              <div>
                <p className="font-medium">Free Quality Content</p>
                <p className="text-sm text-muted-foreground">
                  Keep all our tutorials and resources free and accessible
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0 fill-green-500/20" />
              <div>
                <p className="font-medium">Better Tools & Resources</p>
                <p className="text-sm text-muted-foreground">
                  Invest in better tools and infrastructure for content creation
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0 fill-green-500/20" />
              <div>
                <p className="font-medium">More Content</p>
                <p className="text-sm text-muted-foreground">
                  Create more tutorials, reviews, and helpful guides
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0 fill-green-500/20" />
              <div>
                <p className="font-medium">Community Growth</p>
                <p className="text-sm text-muted-foreground">
                  Build a stronger developer community together
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500 fill-green-500/20" />
              Make a Donation
            </CardTitle>
            <CardDescription>
              Choose an amount or enter a custom amount
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Currency Selection */}
            <div className="space-y-2">
              <Label>Currency / Payment Method</Label>
              <RadioGroup 
                value={currency} 
                onValueChange={(value) => {
                  setCurrency(value as "KES" | "USD");
                  setSelectedAmount(null);
                  setCustomAmount("");
                }}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-border hover:border-primary/50 transition-all">
                    <RadioGroupItem value="KES" id="kes" />
                    <Label htmlFor="kes" className="font-normal cursor-pointer flex-1">
                      <div>
                        <div className="font-medium">KES (Kenyan Shillings)</div>
                        <div className="text-xs text-muted-foreground">Pay with M-Pesa or Mobile Money</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-border hover:border-primary/50 transition-all">
                    <RadioGroupItem value="USD" id="usd" />
                    <Label htmlFor="usd" className="font-normal cursor-pointer flex-1">
                      <div>
                        <div className="font-medium">USD (US Dollars)</div>
                        <div className="text-xs text-muted-foreground">Pay with Bank Transfer (All major banks supported)</div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Preset Amounts */}
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="grid grid-cols-2 gap-3">
                {presetAmounts.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.amount}
                      onClick={() => {
                        setSelectedAmount(preset.amount);
                        setCustomAmount("");
                      }}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left group ${
                        selectedAmount === preset.amount
                          ? "border-primary bg-gradient-to-br from-primary/20 to-primary/5 shadow-md scale-[1.02]"
                          : "border-border hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01]"
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-2 transition-all duration-200 ${
                        selectedAmount === preset.amount
                          ? "text-primary scale-110"
                          : "text-primary/70 group-hover:text-primary group-hover:scale-110"
                      }`} />
                      <div className="font-bold text-lg">
                        {currency === "KES" ? `KES ${preset.amount.toLocaleString()}` : `$${preset.amount}`}
                      </div>
                      <div className="text-xs text-muted-foreground">{preset.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label htmlFor="custom-amount">Custom Amount ({currency})</Label>
              <div className="relative">
                {currency === "KES" && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">KES</span>
                )}
                {currency === "USD" && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                )}
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  max="100000"
                  step={currency === "KES" ? "1" : "0.01"}
                  placeholder={`Enter amount in ${currency}`}
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className={currency === "KES" ? "pl-16" : "pl-8"}
                />
              </div>
            </div>

            {/* Email - Required for USD, Optional for KES */}
            {currency === "USD" && (
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Required for payment receipt</p>
              </div>
            )}

            {currency === "KES" && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                  Mobile Money Payment
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>What you'll need:</strong> Your phone number (M-Pesa, Airtel Money, or other mobile money provider)
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  After clicking "Donate", you'll be redirected to enter your phone number and complete the payment.
                </p>
              </div>
            )}

            {/* Recurring Donation */}
            <div className="space-y-2">
              <Label>Donation Type</Label>
              <RadioGroup value={isRecurring ? "recurring" : "one-time"} onValueChange={(value) => setIsRecurring(value === "recurring")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="one-time" id="one-time" />
                  <Label htmlFor="one-time" className="font-normal cursor-pointer">
                    One-time donation
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="recurring" id="recurring" />
                  <Label htmlFor="recurring" className="font-normal cursor-pointer">
                    Monthly recurring donation
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Donate Button */}
            <Button
              onClick={handleDonate}
              disabled={loading || (!selectedAmount && !customAmount) || (currency === "USD" && !email)}
              className="w-full"
              size="lg"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  {isRecurring ? "Start Monthly Donation" : "Donate Now"}
                </>
              )}
            </Button>

            <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-lg p-4 space-y-3 border border-border/50">
              <div className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-xs font-semibold text-center">
                  Payment Process
                </p>
              </div>
              <div className="flex items-start justify-center gap-2">
                {currency === "KES" ? (
                  <>
                    <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-center text-muted-foreground">
                      Pay with M-Pesa/Mobile Money • Enter your phone number on the payment page
                    </p>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-center text-muted-foreground">
                      Pay with Bank Transfer • All major banks supported • Email required for receipt
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/50">
                <Shield className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                <p className="text-xs text-center text-muted-foreground">
                  Secure payment powered by Paystack • Your payment information is encrypted
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandHeart className="h-5 w-5 text-primary animate-pulse" />
            Thank You!
          </CardTitle>
          <CardDescription>
            Every donation, no matter the size, makes a difference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We're incredibly grateful for your support. Your contribution helps us continue creating
            valuable content for the developer community. Thank you for being part of our journey!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

