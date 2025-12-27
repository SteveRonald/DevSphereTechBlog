"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";

export default function DonateCancelPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-12 md:py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-4">
              <XCircle className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl mb-2">Donation Cancelled</CardTitle>
          <CardDescription className="text-lg">
            Your donation was not processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              No worries! Your donation was cancelled and no payment was processed.
            </p>
            <p className="text-muted-foreground">
              If you'd like to support us in the future, we'd be happy to have you back!
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Other ways to support us:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Share our content with your network</li>
              <li>Engage with our posts and tutorials</li>
              <li>Provide feedback to help us improve</li>
              <li>Come back anytime to make a donation</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link href="/donate">
                Try Again
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}











