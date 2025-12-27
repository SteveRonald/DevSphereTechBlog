"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function RetakeFinalExamPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!slug) return;
      if (authLoading) return;

      if (!user) {
        router.push(`/auth?redirect=/courses/${encodeURIComponent(slug)}/retake-final-exam`);
        return;
      }

      try {
        const supabase = createClient();

        const { data: course, error: courseError } = await supabase
          .from("courses")
          .select("id,slug")
          .eq("slug", slug)
          .single();

        if (courseError || !course) {
          throw new Error(courseError?.message || "Course not found");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const res = await fetch(`/api/courses/${course.id}/retake-final-exam`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to reset final exam");
        }

        toast({ title: "Final exam reset", description: "You can now retake the final exam." });
        router.push(`/courses/${encodeURIComponent(slug)}/learn`);
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Failed", variant: "destructive" });
        router.push(`/courses/${encodeURIComponent(slug)}/learn`);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [slug, router, user, authLoading]);

  return (
    <div className="container max-w-2xl mx-auto px-4 md:px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Retake Final Exam</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {loading ? "Preparing your retake..." : "Redirecting..."}
        </CardContent>
      </Card>
    </div>
  );
}
