"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity/sanity.config";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function StudioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/auth?redirect=/studio");
    }
  }, [user, authLoading, router, mounted]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || authLoading) {
        setCheckingAdmin(true);
        return;
      }

      // Wait a bit to ensure user profile is loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (error) {
          // If profile doesn't exist yet, wait and retry once
          if (error.code === "PGRST116") {
            await new Promise(resolve => setTimeout(resolve, 500));
            const retry = await supabase
              .from("user_profiles")
              .select("is_admin")
              .eq("id", user.id)
              .single();
            
            if (retry.error && retry.error.code !== "PGRST116") {
              console.error("Error checking admin status:", retry.error);
              setIsAdmin(false);
            } else {
              setIsAdmin(retry.data?.is_admin === true);
            }
          } else {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(data?.is_admin === true);
        }
      } catch (error) {
        console.error("Error:", error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (mounted && user && !authLoading) {
      checkAdmin();
    } else if (mounted && !user && !authLoading) {
      setCheckingAdmin(false);
    }
  }, [user, mounted, authLoading]);

  if (!mounted || authLoading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show access denied if not admin
  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-6 w-6 text-destructive" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              This page is restricted to administrators only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need administrator privileges to access the CMS Studio. If you believe this is an error, please contact the site administrator.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="flex-1"
              >
                Go Home
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.push("/");
                }}
                className="flex-1"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only show studio if admin check is complete and user is admin
  if (isAdmin !== true) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Render studio below navbar
  return (
    <div style={{ height: "calc(100vh - 64px)", width: "100%" }}>
      <NextStudio config={config} />
    </div>
  );
}
