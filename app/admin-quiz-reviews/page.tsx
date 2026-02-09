"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

type Submission = {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  student?: {
    id: string;
    email: string;
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  lesson?: {
    id: string;
    title: string;
  } | null;
  answers: any;
  status: "pending_review" | "graded";
  created_at: string;
};

type StatusFilter = "all" | "pending_review" | "graded";

export default function AdminQuizReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/auth?redirect=/admin-quiz-reviews");
    }
  }, [user, authLoading, router, mounted]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || authLoading) {
        setCheckingAdmin(true);
        return;
      }

      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const showLoading = !mounted || authLoading || checkingAdmin || isAdmin !== true;

  const loadSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/quiz-submissions?status=all", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load quiz submissions");
      }

      setSubmissions(data.submissions || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (!showLoading) {
      void loadSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoading]);

  const freeTextPreview = (answers: any) => {
    const list = Array.isArray(answers) ? answers : [];
    const first = list.find((a) => a?.question_type === "free_text" && typeof a?.answer_text === "string");
    return first?.answer_text || "—";
  };

  const openReview = (id: string) => {
    router.push(`/admin-quiz-reviews/${id}`);
  };

  const studentLabel = (s: Submission) => {
    const p = s.student;
    const name =
      (p?.display_name && p.display_name.trim()) ||
      ([p?.first_name, p?.last_name].filter(Boolean).join(" ").trim()) ||
      p?.email ||
      s.user_id;
    return name;
  };

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === "all") return submissions;
    return submissions.filter((s) => s.status === statusFilter);
  }, [submissions, statusFilter]);

  const pendingCount = useMemo(() => submissions.filter((s) => s.status === "pending_review").length, [submissions]);
  const gradedCount = useMemo(() => submissions.filter((s) => s.status === "graded").length, [submissions]);

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending_review": return "destructive" as const;
      case "graded": return "default" as const;
      default: return "outline" as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "pending_review": return "Pending Review";
      case "graded": return "Graded";
      default: return status;
    }
  };

  return (
    <AdminShell
      title="Quiz Reviews"
      subtitle="Review free-text quiz submissions"
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
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Quiz Submissions</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                  <Button
                    variant={statusFilter === "all" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setStatusFilter("all")}
                  >
                    All ({submissions.length})
                  </Button>
                  <Button
                    variant={statusFilter === "pending_review" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setStatusFilter("pending_review")}
                  >
                    Pending ({pendingCount})
                  </Button>
                  <Button
                    variant={statusFilter === "graded" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setStatusFilter("graded")}
                  >
                    Graded ({gradedCount})
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => void loadSubmissions()} disabled={loadingSubmissions}>
                  {loadingSubmissions ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSubmissions ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Answer (preview)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {statusFilter === "all" ? "No submissions" : `No ${statusLabel(statusFilter).toLowerCase()} submissions`}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubmissions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(s.status)}>{statusLabel(s.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">{studentLabel(s)}</div>
                          <div className="text-xs text-muted-foreground">{s.student?.email || ""}</div>
                        </TableCell>
                        <TableCell className="text-sm">{s.lesson?.title || s.lesson_id}</TableCell>
                        <TableCell className="max-w-[420px] truncate">
                          {freeTextPreview(s.answers)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant={s.status === "graded" ? "outline" : "default"} onClick={() => openReview(s.id)}>
                            {s.status === "graded" ? "Re-review" : "Review"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}
