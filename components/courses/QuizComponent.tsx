"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface QuizQuestion {
  question_type?: "multiple_choice" | "free_text";
  question: string;
  options?: string[];
  correct_answer?: number | string;
  explanation: string;
  max_marks?: number;
}

type SubmissionAnswer = {
  question_index: number;
  question_type: "multiple_choice" | "free_text";
  selected_option?: number | null;
  answer_text?: string | null;
};

type LessonQuizSubmission = {
  id: string;
  status: "pending_review" | "graded";
  is_passed?: boolean | null;
  score?: number | null;
  total?: number | null;
  answers?: SubmissionAnswer[];
  attachment_urls?: string[];
};

interface QuizComponentProps {
  quizData: {
    questions: QuizQuestion[];
    assessment_type?: "cat" | "final_exam";
  };
  courseId: string;
  lessonId: string;
  onComplete: () => void;
  onFinished?: () => void;
}

export function QuizComponent({ quizData, courseId, lessonId, onComplete, onFinished }: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [textAnswers, setTextAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);
  const [loadedSubmission, setLoadedSubmission] = useState<LessonQuizSubmission | null>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [retryUsed, setRetryUsed] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const assessmentType = quizData?.assessment_type === "final_exam" ? "final_exam" : "cat";
  const isFinalExam = assessmentType === "final_exam";

  const questionType = (q: QuizQuestion) => q.question_type || "multiple_choice";

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;

  const hasFreeText = useMemo(
    () => quizData.questions.some((q) => questionType(q) === "free_text"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quizData]
  );

  const loadSubmission = async () => {
      try {
        setLoadingSubmission(true);
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const res = await fetch(`/api/quiz-submissions?lesson_id=${encodeURIComponent(lessonId)}`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          }
        );

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load quiz submission");
        }

        const submission = (data?.submission || null) as LessonQuizSubmission | null;
        setLoadedSubmission(submission);

        const existingAttachments = Array.isArray((submission as any)?.attachment_urls)
          ? (submission as any).attachment_urls
          : [];
        setAttachmentUrls(existingAttachments);

        if (submission?.answers && Array.isArray(submission.answers)) {
          const nextAnswers: number[] = [];
          const nextText: string[] = [];
          submission.answers.forEach((a) => {
            if (typeof a?.question_index !== "number") return;
            if (a.question_type === "multiple_choice") {
              nextAnswers[a.question_index] = typeof a.selected_option === "number" ? a.selected_option : (undefined as any);
            }
            if (a.question_type === "free_text") {
              nextText[a.question_index] = typeof a.answer_text === "string" ? a.answer_text : "";
            }
          });
          setAnswers(nextAnswers);
          setTextAnswers(nextText);
        }

        // Jump to first unanswered question (best-effort)
        const firstUnanswered = quizData.questions.findIndex((q, idx) => {
          const qt = questionType(q);
          if (qt === "multiple_choice") return typeof (submission as any)?.answers?.find((a: any) => a?.question_index === idx)?.selected_option !== "number";
          const txt = (submission as any)?.answers?.find((a: any) => a?.question_index === idx)?.answer_text;
          return !(typeof txt === "string" && txt.trim().length > 0);
        });
        if (firstUnanswered >= 0) {
          setCurrentQuestionIndex(firstUnanswered);
        }

        if (submission?.status === "pending_review") {
          setPendingReview(true);
          return;
        }

        if (submission?.status === "graded") {
          setPendingReview(false);
          if (typeof submission.score === "number") {
            setScore(submission.score);
          }
          setShowResults(true);
          onComplete();
        }
      } catch {
        // ignore load errors (treat as not started)
      } finally {
        setLoadingSubmission(false);
      }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const fd = new FormData();
      fd.append("file", file);
      fd.append("lesson_id", lessonId);
      fd.append("purpose", "quiz_answer");

      const res = await fetch("/api/student-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      const url = typeof data?.url === "string" ? data.url : "";
      if (!url) {
        throw new Error("Upload failed");
      }

      setAttachmentUrls((prev) => Array.from(new Set([...prev, url])).slice(0, 10));
      toast({ title: "Uploaded", description: "File attached." });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Could not upload file", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    void loadSubmission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const getCorrectIndex = (q: QuizQuestion): number | null => {
    const raw = (q as any)?.correct_answer;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string") {
      const parsed = parseInt(raw, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const allAnswered = useMemo(() => {
    return quizData.questions.every((q, idx) => {
      const qt = questionType(q);
      if (qt === "multiple_choice") return typeof answers[idx] === "number";
      return (textAnswers[idx] || "").trim().length > 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizData, answers, textAnswers]);

  const computeMcqScore = () => {
    const mcq = quizData.questions
      .map((q, index) => ({ q, index }))
      .filter(({ q }) => questionType(q) === "multiple_choice");

    let correct = 0;
    for (const { q, index } of mcq) {
      const correctIndex = getCorrectIndex(q);
      if (typeof correctIndex === "number" && answers[index] === correctIndex) {
        correct++;
      }
    }
    return { score: correct, total: mcq.length };
  };

  const submitAll = async () => {
    const submissionAnswers: SubmissionAnswer[] = quizData.questions.map((q, index) => {
      const qt = questionType(q);
      return {
        question_index: index,
        question_type: qt,
        selected_option: qt === "multiple_choice" ? (typeof answers[index] === "number" ? answers[index] : null) : null,
        answer_text: qt === "free_text" ? (textAnswers[index] ?? "") : null,
      };
    });

    const { score: mcqScore, total: mcqTotal } = computeMcqScore();

    try {
      setSubmitting(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("/api/quiz-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: lessonId,
          answers: submissionAnswers,
          attachment_urls: attachmentUrls,
          score: !hasFreeText && mcqTotal > 0 ? mcqScore : null,
          total: !hasFreeText && mcqTotal > 0 ? mcqTotal : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit quiz");
      }

      const submission = (data?.submission || null) as LessonQuizSubmission | null;
      if (submission) setLoadedSubmission(submission);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to submit quiz", variant: "destructive" });
      return;
    } finally {
      setSubmitting(false);
    }

    onFinished?.();

    if (hasFreeText) {
      setPendingReview(true);
      return;
    }

    const { score: finalScore, total: totalMcq } = computeMcqScore();
    setScore(finalScore);
    setShowResults(true);
    onComplete();
  };

  if (pendingReview) {
    return (
      <Card className="border-2 overflow-hidden">
        <CardHeader className="overflow-x-hidden">
          <CardTitle className="text-center">
            <div className="flex items-center justify-center gap-2 text-yellow-600">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <span className="break-words">{isFinalExam ? "Final Exam Submitted" : "Submitted for Review"}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-center overflow-x-hidden">
          <p className="text-muted-foreground">
            Your answers were submitted. An instructor will review your free-text responses.
          </p>
          <p className="text-sm text-muted-foreground">
            {isFinalExam
              ? "Your course will be finalized after your final exam is graded."
              : "You can continue to the next lesson while we review."}
          </p>
          <div className="pt-2 flex justify-center">
            <Button variant="outline" onClick={() => void loadSubmission()}>
              Check status
            </Button>
          </div>

          {attachmentUrls.length > 0 ? (
            <div className="pt-4 text-left">
              <div className="text-sm font-medium mb-2">Attachments</div>
              <div className="space-y-1">
                {attachmentUrls.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noreferrer" className="block text-sm underline">
                    {u}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const totalPossible = (() => {
      if (hasFreeText) {
        return typeof loadedSubmission?.total === "number" ? loadedSubmission.total : 0;
      }
      return quizData.questions.filter((q) => questionType(q) === "multiple_choice").length;
    })();
    const percentage = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;
    const passed = percentage >= 70;
    const failedIndexes = hasFreeText
      ? []
      : quizData.questions
      .map((q, index) => ({ q, index }))
      .filter(({ q }) => questionType(q) === "multiple_choice")
      .map(({ q, index }) => {
        const userAnswer = answers[index];
        const correctIndex = getCorrectIndex(q);
        const isCorrect = typeof correctIndex === "number" && userAnswer === correctIndex;
        return isCorrect ? null : index;
      })
      .filter((v): v is number => typeof v === "number");

    return (
      <Card className="border-2 overflow-hidden">
        <CardHeader className="overflow-x-hidden">
          <CardTitle className="text-center">
            {passed ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <span className="break-words">{isFinalExam ? "Final Exam Completed" : "Quiz Completed!"}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-yellow-600">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <span className="break-words">{isFinalExam ? "Final Exam Completed" : "Quiz Completed"}</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 overflow-x-hidden">
          <div className="text-center overflow-x-hidden">
            <div className="text-3xl sm:text-4xl font-bold mb-2 break-words">
              {score} / {totalPossible}
            </div>
            <div className="text-xl sm:text-2xl font-semibold mb-4 break-words">
              {percentage}%
            </div>
            <Badge variant={passed ? "default" : "outline"} className="text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 break-words">
              {isFinalExam ? (passed ? "Final exam submitted" : "Final exam submitted") : passed ? "Great job" : "Keep practicing"}
            </Badge>
          </div>

          {!passed ? (
            <div className="rounded-lg border border-border p-4 bg-muted/40 overflow-x-hidden">
              <p className="font-medium break-words">Keep going — take your study seriously and you will improve.</p>
              {failedIndexes.length > 0 ? (
                <p className="text-sm text-muted-foreground mt-1 break-words">
                  Review the questions you missed: {failedIndexes
                    .map((i) => i + 1)
                    .join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}

          {!hasFreeText && !passed && !retryUsed ? (
            <div className="flex justify-center overflow-x-hidden">
              <Button
                variant="outline"
                onClick={() => {
                  setRetryUsed(true);
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setAnswers([]);
                  setTextAnswers([]);
                  setLoadedSubmission(null);
                }}
                className="w-full sm:w-auto"
              >
                Retry Quiz (1 attempt)
              </Button>
            </div>
          ) : null}

          {!hasFreeText ? (
            <div className="space-y-4 overflow-x-hidden">
              <h3 className="font-semibold break-words">Review Answers:</h3>
              {quizData.questions
                .map((question, index) => ({ question, index }))
                .filter(({ question }) => questionType(question) === "multiple_choice")
                .map(({ question, index }) => {
              const userAnswer = answers[index];
              const correctIndex = getCorrectIndex(question);
              const isCorrect = typeof correctIndex === "number" && userAnswer === correctIndex;

              return (
                <Card
                  key={index}
                  className={cn(
                    "border-2 overflow-hidden",
                    isCorrect ? "border-green-500" : "border-red-500"
                  )}
                >
                  <CardHeader className="overflow-x-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm break-words flex-1 min-w-0">
                        Question {index + 1}
                      </CardTitle>
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 overflow-x-hidden">
                    <p className="font-medium break-words">{question.question}</p>
                    <div className="space-y-2">
                      {(question.options || []).map((option, optIndex) => {
                        const isSelected = userAnswer === optIndex;
                        const isCorrectAnswer = typeof correctIndex === "number" && optIndex === correctIndex;

                        return (
                          <div
                            key={optIndex}
                            className={cn(
                              "p-3 rounded-lg border overflow-x-hidden",
                              isCorrectAnswer
                                ? "bg-green-500/10 border-green-500"
                                : isSelected && !isCorrectAnswer
                                ? "bg-red-500/10 border-red-500"
                                : "bg-muted border-border"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isCorrectAnswer && (
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              )}
                              {isSelected && !isCorrectAnswer && (
                                <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                              )}
                              <span className="break-words flex-1 min-w-0">{option}</span>
                              {isCorrectAnswer && (
                                <Badge variant="outline" className="ml-auto text-xs shrink-0">
                                  Correct Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-muted rounded-lg overflow-x-hidden">
                        <p className="text-sm text-muted-foreground break-words">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            </div>
          ) : (
            <div className="rounded-lg border border-border p-4 bg-muted/40 text-sm text-muted-foreground overflow-x-hidden break-words">
              {isFinalExam
                ? "Your final exam results will be used to compute your final course grade once all grading is complete."
                : "This assessment has been graded."}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (loadingSubmission) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">Loading quiz...</CardContent>
      </Card>
    );
  }

  const currentAnswered = (() => {
    const qt = questionType(currentQuestion);
    if (qt === "multiple_choice") return typeof answers[currentQuestionIndex] === "number";
    return (textAnswers[currentQuestionIndex] || "").trim().length > 0;
  })();

  const goNext = () => {
    if (!currentAnswered) return;
    if (!isLastQuestion) setCurrentQuestionIndex((i) => i + 1);
  };

  const goPrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex((i) => i - 1);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="overflow-x-hidden">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="break-words flex-1 min-w-0">{isFinalExam ? "Final Exam" : "Quiz"}</CardTitle>
          <Badge variant="outline" className="shrink-0">
            Question {currentQuestionIndex + 1} of {quizData.questions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 overflow-x-hidden">
        <div className="rounded-md border border-border p-3 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium break-words">Attachments (optional)</div>
              <div className="text-xs text-muted-foreground break-words">PDF/PNG/JPG/ZIP up to 10MB</div>
            </div>
            <label className="inline-flex shrink-0">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.zip"
                disabled={uploading || submitting}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void uploadFile(f);
                }}
              />
              <Button type="button" variant="outline" disabled={uploading || submitting} className="w-full sm:w-auto">
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </label>
          </div>

          {attachmentUrls.length > 0 ? (
            <div className="mt-3 space-y-1">
              {attachmentUrls.map((u) => (
                <div key={u} className="flex items-center justify-between gap-2">
                  <a href={u} target="_blank" rel="noreferrer" className="text-xs underline truncate">
                    {u}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachmentUrls((prev) => prev.filter((x) => x !== u))}
                    disabled={uploading || submitting}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <Card className="border overflow-hidden">
          <CardHeader className="pb-3 overflow-x-hidden">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm break-words flex-1 min-w-0">Question {currentQuestionIndex + 1}</CardTitle>
              {typeof currentQuestion?.max_marks === "number" ? (
                <Badge variant="outline" className="shrink-0">{currentQuestion.max_marks} marks</Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 overflow-x-hidden">
            <p className="font-medium break-words">{currentQuestion?.question}</p>
            {questionType(currentQuestion) === "multiple_choice" ? (
              <RadioGroup
                value={typeof answers[currentQuestionIndex] === "number" ? answers[currentQuestionIndex].toString() : ""}
                onValueChange={(value) => {
                  const next = [...answers];
                  next[currentQuestionIndex] = parseInt(value, 10);
                  setAnswers(next);
                }}
                className="space-y-2"
              >
                {(currentQuestion?.options || []).map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center space-x-2 p-2 rounded-md border border-border overflow-x-hidden">
                    <RadioGroupItem value={optIdx.toString()} id={`q-${currentQuestionIndex}-opt-${optIdx}`} className="shrink-0" />
                    <Label htmlFor={`q-${currentQuestionIndex}-opt-${optIdx}`} className="flex-1 break-words min-w-0 cursor-pointer">
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2 overflow-x-hidden">
                <Label className="break-words">Your answer</Label>
                <Textarea
                  value={textAnswers[currentQuestionIndex] || ""}
                  onChange={(e) => {
                    const next = [...textAnswers];
                    next[currentQuestionIndex] = e.target.value;
                    setTextAnswers(next);
                  }}
                  placeholder="Type your answer here..."
                  rows={6}
                  className="w-full max-w-full resize-none"
                />
                <p className="text-xs text-muted-foreground break-words">This answer will be reviewed by an instructor.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 overflow-x-hidden">
          <Button variant="outline" onClick={goPrevious} disabled={currentQuestionIndex === 0} className="w-full sm:w-auto shrink-0">
            Previous
          </Button>

          {isLastQuestion ? (
            <Button onClick={() => void submitAll()} disabled={submitting || !allAnswered} className="w-full sm:w-auto shrink-0">
              {submitting ? "Submitting..." : "Finish"}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={submitting || !currentAnswered} className="w-full sm:w-auto shrink-0">
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}









