"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase";
import { Loader2, CheckCircle2, XCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false);
  const [unsubscribeReason, setUnsubscribeReason] = useState("");

  // Check subscription status when email changes
  useEffect(() => {
    const checkSubscription = async () => {
      if (!email || !email.includes("@")) {
        setIsSubscribed(null);
        return;
      }

      setChecking(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("newsletter_subscriptions")
          .select("is_active")
          .eq("email", email.toLowerCase().trim())
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows returned
          console.error("Error checking subscription:", error);
          setIsSubscribed(null);
        } else {
          setIsSubscribed(data?.is_active === true);
        }
      } catch (error) {
        setIsSubscribed(null);
      } finally {
        setChecking(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkSubscription, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (isSubscribed) {
      setShowUnsubscribeDialog(true);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .upsert(
          {
            email: email.toLowerCase().trim(),
            source: "sidebar",
            is_active: true,
          },
          {
            onConflict: "email",
          }
        );

      if (error) {
        throw error;
      }

      setIsSubscribed(true);
      toast({
        title: "Success!",
        description: "You've been subscribed to our newsletter.",
      });
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email || !isSubscribed || !unsubscribeReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for unsubscribing.",
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
          unsubscribe_reason: unsubscribeReason.trim(),
          unsubscribed_at: new Date().toISOString(),
        })
        .eq("email", email.toLowerCase().trim());

      if (error) throw error;

      setIsSubscribed(false);
      setShowUnsubscribeDialog(false);
      setUnsubscribeReason("");
      toast({
        title: "Unsubscribed",
        description: "We're sorry to see you go! Your feedback helps us improve. You can resubscribe anytime.",
      });
      setEmail("");
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

  return (
    <>
      <form onSubmit={handleSubscribe} className="space-y-2">
        <div className="relative">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background pr-10"
            disabled={loading}
            required
          />
          {checking && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!checking && isSubscribed !== null && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isSubscribed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {isSubscribed ? (
          <div className="space-y-2">
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
              ✓ This email is already subscribed
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowUnsubscribeDialog(true)}
              disabled={loading}
            >
              Unsubscribe
            </Button>
          </div>
        ) : (
          <Button type="submit" className="w-full" disabled={loading || checking}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              "Subscribe"
            )}
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center pt-1">
          No spam, unsubscribe anytime.
        </p>
      </form>

      {/* Unsubscribe Dialog */}
      <Dialog open={showUnsubscribeDialog} onOpenChange={setShowUnsubscribeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>We're Sorry to See You Go!</DialogTitle>
            <DialogDescription>
              Your feedback helps us improve. Please let us know why you're unsubscribing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="unsubscribe-reason">Reason for unsubscribing *</Label>
              <Textarea
                id="unsubscribe-reason"
                placeholder="e.g., Too many emails, content not relevant, etc."
                value={unsubscribeReason}
                onChange={(e) => setUnsubscribeReason(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-1">Thank you for being part of our community!</p>
              <p>We appreciate your time with us. If you change your mind, you can always resubscribe anytime.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUnsubscribeDialog(false);
                  setUnsubscribeReason("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleUnsubscribe}
                disabled={loading || !unsubscribeReason.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unsubscribing...
                  </>
                ) : (
                  "Confirm Unsubscribe"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
