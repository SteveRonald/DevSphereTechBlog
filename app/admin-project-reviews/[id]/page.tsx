"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Submission = {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  submission_text?: string | null;
  submission_url?: string | null;
  attachment_urls?: string[];
  status: "pending_review" | "approved" | "rejected";
  feedback?: string | null;
  created_at: string;
  updated_at: string;
};

type StudentProfile = {
  id: string;
  email: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export default function AdminProjectReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const id = params?.id as string;

  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string>("");
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push(`/auth?redirect=/admin-project-reviews/${encodeURIComponent(id || "")}`);
    }
  }, [user, authLoading, router, mounted, id]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || authLoading) {
        setCheckingAdmin(true);
        return;
      }

      try {
        const supabase = createClient();
        const { data } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single();
        setIsAdmin(data?.is_admin === true);
      } catch {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (mounted && user && !authLoading) {
      void checkAdmin();
    } else if (mounted && !user && !authLoading) {
      setCheckingAdmin(false);
    }
  }, [user, mounted, authLoading]);

  const showLoading = !mounted || authLoading || checkingAdmin || isAdmin !== true;

  const load = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`/api/admin/project-submissions/${encodeURIComponent(id)}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load submission");
      }

      setSubmission(data.submission || null);
      setLessonTitle(data?.lesson?.title || "");
      setStudent(data?.student || null);
      setFeedback(typeof data?.submission?.feedback === "string" ? data.submission.feedback : "");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showLoading) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoading, id]);

  const studentLabel = useMemo(() => {
    const p = student;
    return (
      (p?.display_name && p.display_name.trim()) ||
      ([p?.first_name, p?.last_name].filter(Boolean).join(" ").trim()) ||
      p?.email ||
      submission?.user_id ||
      ""
    );
  }, [student, submission?.user_id]);

  const setDecision = async (status: "approved" | "rejected") => {
    if (!id) return;

    try {
      setSaving(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`/api/admin/project-submissions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ status, feedback }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update");
      }

      toast({ title: "Saved", description: status === "approved" ? "Project approved." : "Project rejected." });
      router.push("/admin-project-reviews");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <AdminShell
      title="Review Project"
      subtitle={lessonTitle ? `Lesson: ${lessonTitle}` : "Project submission"}
      userEmail={user?.email}
      userName={user?.email}
      onSignOut={handleSignOut}
    >
      {showLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !submission ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Submission not found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Submission</CardTitle>
                <Badge variant={submission.status === "pending_review" ? "destructive" : submission.status === "approved" ? "default" : "secondary"}>
                  {submission.status === "pending_review" ? "Pending Review" : submission.status === "approved" ? "Approved" : "Rejected"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Student:</span>{" "}
                <span className="font-medium">{studentLabel}</span>
                {student?.email ? <span className="text-muted-foreground"> ({student.email})</span> : null}
              </div>
              <div>
                <span className="text-muted-foreground">Lesson:</span>{" "}
                <span className="font-medium">{lessonTitle || submission.lesson_id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted:</span> {new Date(submission.created_at).toLocaleString()}
              </div>
              <div>
                <span className="text-muted-foreground">URL:</span>{" "}
                {submission.submission_url ? (
                  <a className="underline" href={submission.submission_url} target="_blank" rel="noreferrer">
                    {submission.submission_url}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.isArray((submission as any)?.attachment_urls) && (submission as any).attachment_urls.length > 0 ? (
                <div>
                  <div className="text-sm font-medium mb-1">Attachments</div>
                  <div className="space-y-1">
                    {(submission as any).attachment_urls.map((u: string) => (
                      <a key={u} className="block text-sm underline break-all" href={u} target="_blank" rel="noreferrer">
                        {u}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="whitespace-pre-wrap rounded-md border border-border p-3 text-sm bg-muted/40">
                {submission.submission_text || "—"}
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Feedback</div>
                <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Optional feedback" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => router.push("/admin-project-reviews")} disabled={saving}>
                  Back
                </Button>
                <Button variant="outline" onClick={() => void setDecision("rejected")} disabled={saving}>
                  {submission.status === "rejected" ? "Re-reject" : "Reject"}
                </Button>
                <Button onClick={() => void setDecision("approved")} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : submission.status === "approved" ? "Re-approve" : "Approve"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}
