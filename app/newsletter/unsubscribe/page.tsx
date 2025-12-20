"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email");
  
  const [email, setEmail] = useState(emailFromUrl || "");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .update({ 
          is_active: false,
          unsubscribe_reason: reason.trim() || "No reason provided",
          unsubscribed_at: new Date().toISOString(),
        })
        .eq("email", email.toLowerCase().trim());

      if (error) throw error;

      setUnsubscribed(true);
      toast({
        title: "Unsubscribed",
        description: "You've been successfully unsubscribed from our newsletter.",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unsubscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (unsubscribed) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Successfully Unsubscribed</CardTitle>
            <CardDescription>
              You've been removed from our newsletter mailing list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We're sorry to see you go! Your feedback helps us improve our content.
            </p>
            <p className="text-sm text-muted-foreground">
              You can resubscribe anytime by visiting our website and entering your email in the newsletter form.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Unsubscribe from Newsletter</CardTitle>
          <CardDescription>
            We're sorry to see you go. Please let us know why you're unsubscribing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnsubscribe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Unsubscribing (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us improve by sharing why you're unsubscribing..."
                rows={4}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unsubscribing...
                </>
              ) : (
                "Unsubscribe"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}



