"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ArrowLeft, Heart, HandHeart, Mail, Smartphone } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

export default function DonateSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const [loading, setLoading] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12 md:py-16">
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-500/20 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-3xl mb-2 flex items-center justify-center gap-2">
            <HandHeart className="h-8 w-8 text-primary animate-pulse" />
            Thank You!
          </CardTitle>
          <CardDescription className="text-lg">
            Your donation has been successfully processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              We're incredibly grateful for your support! Your contribution helps us continue creating
              valuable content for the developer community.
            </p>
            {reference && (
              <p className="text-sm text-muted-foreground mt-4">
                Transaction Reference: <code className="text-xs bg-muted px-2 py-1 rounded">{reference}</code>
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              What happens next?
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>You'll receive a receipt via email (if provided)</li>
              <li>Your support helps us create more free content</li>
              <li>We'll continue to deliver high-quality tutorials and resources</li>
            </ul>
          </div>

          {/* Optional Email Form for Mobile Money Users */}
          {!emailSent && !showEmailForm && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Paid with Mobile Money?
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                    Want to receive a thank you email and receipt? Enter your email below.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmailForm(true)}
                    className="w-full sm:w-auto"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Get Thank You Email
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showEmailForm && !emailSent && (
            <Card className="border-blue-200 dark:border-blue-900">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="donor-email">Email Address (Optional)</Label>
                  <Input
                    id="donor-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={sendingEmail}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send you a thank you email and receipt for your donation.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (!email || !email.includes("@")) {
                        toast({
                          title: "Invalid email",
                          description: "Please enter a valid email address",
                          variant: "destructive",
                        });
                        return;
                      }

                      if (!reference) {
                        toast({
                          title: "Error",
                          description: "Transaction reference not found",
                          variant: "destructive",
                        });
                        return;
                      }

                      setSendingEmail(true);
                      try {
                        const response = await fetch("/api/donate/send-thank-you", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            email,
                            reference,
                          }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                          setEmailSent(true);
                          toast({
                            title: "Email sent!",
                            description: "Check your inbox for your thank you email and receipt.",
                          });
                        } else {
                          throw new Error(data.error || "Failed to send email");
                        }
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to send email. Please try again.",
                          variant: "destructive",
                        });
                      } finally {
                        setSendingEmail(false);
                      }
                    }}
                    disabled={sendingEmail || !email}
                    className="flex-1"
                  >
                    {sendingEmail ? "Sending..." : "Send Thank You Email"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEmailForm(false);
                      setEmail("");
                    }}
                    disabled={sendingEmail}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {emailSent && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Mail className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Thank you email sent! Check your inbox at {email}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/blog">Explore Our Content</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

