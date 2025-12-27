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

type QuizQuestion = {
  question_type?: "multiple_choice" | "free_text";
  question?: string;
  options?: string[];
  correct_answer?: number | string;
  explanation?: string;
  max_marks?: number;
};

type SubmissionAnswer = {
  question_index: number;
  question_type: "multiple_choice" | "free_text";
  selected_option?: number | null;
  answer_text?: string | null;
  awarded_marks?: number | null;
};

type Submission = {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  answers: SubmissionAnswer[];
  attachment_urls?: string[];
  status: "pending_review" | "graded";
  score?: number | null;
  total?: number | null;
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

const maxMarks = (q: QuizQuestion) => {
  const raw = (q as any)?.max_marks;
  return typeof raw === "number" && Number.isFinite(raw) ? Math.max(0, raw) : 1;
};

export default function AdminQuizReviewDetailPage() {
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
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [student, setStudent] = useState<StudentProfile | null>(null);

  const [grades, setGrades] = useState<Record<string, number>>({});

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push(`/auth?redirect=/admin-quiz-reviews/${encodeURIComponent(id || "")}`);
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

      const res = await fetch(`/api/admin/quiz-submissions/${encodeURIComponent(id)}`, {
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
      setQuestions(Array.isArray(data?.questions) ? data.questions : []);
      setStudent(data?.student || null);

      const ans: SubmissionAnswer[] = Array.isArray(data?.submission?.answers) ? data.submission.answers : [];
      const init: Record<string, number> = {};
      ans
        .filter((a) => a?.question_type === "free_text")
        .forEach((a) => {
          init[String(a.question_index)] = typeof a.awarded_marks === "number" ? a.awarded_marks : 0;
        });
      setGrades(init);
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

  const freeTextItems = useMemo(() => {
    const ans = Array.isArray(submission?.answers) ? submission!.answers : [];
    return ans
      .filter((a) => a?.question_type === "free_text")
      .map((a) => {
        const q = questions[a.question_index] || {};
        return {
          question_index: a.question_index,
          question: q?.question || `Question ${a.question_index + 1}`,
          max: maxMarks(q),
          answer_text: a.answer_text || "",
        };
      });
  }, [submission, questions]);

  const saveAndFinalize = async () => {
    if (!id) return;

    try {
      setSaving(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const payload = {
        free_text_grades: freeTextItems.map((i) => ({
          question_index: i.question_index,
          awarded_marks: Math.min(i.max, Math.max(0, Math.floor(grades[String(i.question_index)] ?? 0))),
        })),
      };

      const res = await fetch(`/api/admin/quiz-submissions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to finalize review");
      }

      toast({ title: "Saved", description: "Review finalized and lesson marked complete." });
      router.push("/admin-quiz-reviews");
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
      title="Review Submission"
      subtitle={lessonTitle ? `Lesson: ${lessonTitle}` : "Quiz submission"}
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
                <Badge variant="outline">{submission.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Student:</span>{" "}
                <span className="font-medium">
                  {(student?.display_name && student.display_name.trim()) ||
                    ([student?.first_name, student?.last_name].filter(Boolean).join(" ").trim()) ||
                    student?.email ||
                    submission.user_id}
                </span>
                {student?.email ? <span className="text-muted-foreground"> ({student.email})</span> : null}
              </div>
              <div>
                <span className="text-muted-foreground">Lesson:</span> <span className="font-medium">{lessonTitle || submission.lesson_id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted:</span> {new Date(submission.created_at).toLocaleString()}
              </div>
              {Array.isArray((submission as any)?.attachment_urls) && (submission as any).attachment_urls.length > 0 ? (
                <div>
                  <span className="text-muted-foreground">Attachments:</span>
                  <div className="mt-1 space-y-1">
                    {(submission as any).attachment_urls.map((u: string) => (
                      <a key={u} className="block underline break-all" href={u} target="_blank" rel="noreferrer">
                        {u}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {freeTextItems.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No free-text questions found for manual review.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {freeTextItems.map((item) => (
                <Card key={item.question_index}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-sm">Question {item.question_index + 1}</CardTitle>
                      <Badge variant="outline">Max {item.max}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium">Question</div>
                      <div className="text-sm text-muted-foreground">{item.question}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Student answer</div>
                      <div className="whitespace-pre-wrap rounded-md border border-border p-3 text-sm bg-muted/40">
                        {item.answer_text || "—"}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-sm font-medium">Awarded marks</div>
                        <Input
                          type="number"
                          min={0}
                          max={item.max}
                          step={1}
                          value={grades[String(item.question_index)] ?? 0}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value, 10);
                            const safe = Number.isFinite(raw) ? raw : 0;
                            setGrades((prev) => ({ ...prev, [String(item.question_index)]: safe }));
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => router.push("/admin-quiz-reviews")} disabled={saving}>
                  Back
                </Button>
                <Button onClick={() => void saveAndFinalize()} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalize Review"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
