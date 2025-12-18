"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft, Heart, HandHeart } from "lucide-react";
import Link from "next/link";

export default function DonateSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const [loading, setLoading] = useState(true);

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

