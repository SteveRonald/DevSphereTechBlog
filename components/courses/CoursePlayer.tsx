"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Lock, PlayCircle, ChevronRight, Trophy, Star, Gift, Menu, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CelebrationVariants } from "./CelebrationVariants";
import { LessonContent } from "./LessonContent";
import { EnrollmentCount } from "./EnrollmentCount";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Course {
  id: string;
  title: string;
  slug: string;
  enrollment_count?: number;
  rating?: number;
  total_ratings?: number;
}

interface Lesson {
  id: string;
  course_id: string;
  step_number: number;
  title: string;
  description?: string;
  content_type: string;
  content: any;
  video_url?: string;
  duration?: number;
  is_preview: boolean;
}

interface CoursePlayerProps {
  course: Course;
  lessons: Lesson[];
  currentLesson: Lesson | null;
  currentStepIndex: number;
  completedLessons: Set<string>;
  pendingReviewLessons?: Set<string>;
  enrollment?: { is_completed?: boolean; is_passed?: boolean } | null;
  onLessonComplete: (lessonId: string) => void;
  onLessonChange: (lessonId: string) => void;
}

export function CoursePlayer({
  course,
  lessons,
  currentLesson,
  currentStepIndex,
  completedLessons,
  pendingReviewLessons,
  enrollment,
  onLessonComplete,
  onLessonChange,
}: CoursePlayerProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [celebrationVariant, setCelebrationVariant] = useState<number>(0);
  const prevCompletedCountRef = useRef<number>(completedLessons.size);

  // Calculate progress
  const totalLessons = lessons.length;
  const completedOrPendingCount = (() => {
    const all = new Set<string>();
    completedLessons.forEach((id) => all.add(id));
    (pendingReviewLessons || new Set<string>()).forEach((id) => all.add(id));
    return all.size;
  })();
  const progress = totalLessons > 0 ? (completedOrPendingCount / totalLessons) * 100 : 0;
  const isCourseCompleted = totalLessons > 0 && completedOrPendingCount >= totalLessons;
  // Certificate is only available when course is completed AND final exam is passed
  const canViewCertificate = isCourseCompleted && enrollment?.is_completed === true && enrollment?.is_passed === true;

  // Check if a lesson is unlocked
  const isLessonUnlocked = (lesson: Lesson, index: number) => {
    if (index === 0) return true; // First lesson is always unlocked
    if (lesson.is_preview) return true; // Preview lessons are always unlocked
    // Lesson is unlocked if previous lesson is completed
    const previousLesson = lessons[index - 1];
    return completedLessons.has(previousLesson.id) || pendingReviewLessons?.has(previousLesson.id) === true;
  };

  const handleComplete = (lessonId: string) => {
    if (!completedLessons.has(lessonId)) {
      onLessonComplete(lessonId);
      setJustCompleted(lessonId);
      // Rotate through different celebration variants based on progress
      const progressPercent = (completedOrPendingCount / totalLessons) * 100;
      if (progressPercent < 25) {
        setCelebrationVariant(0); // Fireworks for early progress
      } else if (progressPercent < 50) {
        setCelebrationVariant(1); // Flowers for mid progress
      } else if (progressPercent < 75) {
        setCelebrationVariant(2); // Stars for advanced progress
      } else {
        setCelebrationVariant(3); // Confetti for near completion
      }
      setShowCelebration(true);
      
      // Hide celebration after animation
      setTimeout(() => {
        setShowCelebration(false);
        setJustCompleted(null);
      }, 4000);
    }
  };

  const isFinalExamLesson = (lesson: Lesson) =>
    lesson.content_type === "quiz" &&
    (lesson as any)?.content?.quiz_data?.assessment_type === "final_exam";

  useEffect(() => {
    // If completion happens asynchronously (e.g. manual review approved while user is on the page),
    // still show the celebration.
    const prevCount = prevCompletedCountRef.current;
    const nextCount = completedLessons.size;
    if (nextCount > prevCount) {
      // Find a newly completed lesson (best-effort)
      const newlyCompleted = lessons.find((l) => completedLessons.has(l.id) && (!justCompleted || l.id !== justCompleted));
      if (newlyCompleted && newlyCompleted.id !== justCompleted) {
        const progressPercent = (nextCount / totalLessons) * 100;
        if (progressPercent < 25) {
          setCelebrationVariant(0);
        } else if (progressPercent < 50) {
          setCelebrationVariant(1);
        } else if (progressPercent < 75) {
          setCelebrationVariant(2);
        } else {
          setCelebrationVariant(3);
        }
        setJustCompleted(newlyCompleted.id);
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          setJustCompleted(null);
        }, 4000);
      }
    }
    prevCompletedCountRef.current = nextCount;
  }, [completedLessons, lessons]);

  const handleNextLesson = () => {
    if (currentStepIndex < lessons.length - 1) {
      const nextLesson = lessons[currentStepIndex + 1];
      if (isLessonUnlocked(nextLesson, currentStepIndex + 1)) {
        onLessonChange(nextLesson.id);
      }
    }
  };

  const handlePreviousLesson = () => {
    if (currentStepIndex > 0) {
      const previousLesson = lessons[currentStepIndex - 1];
      onLessonChange(previousLesson.id);
    }
  };

  if (!currentLesson) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No lesson selected.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isUnlocked = isLessonUnlocked(currentLesson, currentStepIndex);
  const isCompleted = completedLessons.has(currentLesson.id);
  const isPendingReview = pendingReviewLessons?.has(currentLesson.id) === true;
  const canProceed = (isCompleted || isPendingReview) && currentStepIndex < lessons.length - 1;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Celebration Animation Overlay */}
      {showCelebration && <CelebrationVariants variant={celebrationVariant} />}

      {/* Progress Bar */}
      <div className="sticky top-14 sm:top-16 z-10 bg-background border-b border-border shadow-sm">
        <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 overflow-x-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm sm:text-base font-medium text-base">Course Progress</span>
              <Badge variant="outline" className="text-xs sm:text-sm shrink-0">{Math.round(progress)}%</Badge>
            </div>
            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden shrink-0">
                  <Menu className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-[400px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Curriculum
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {lessons.map((lesson, index) => {
                    const unlocked = isLessonUnlocked(lesson, index);
                    const completed = completedLessons.has(lesson.id);
                    const pending = pendingReviewLessons?.has(lesson.id) === true;
                    const isCurrent = lesson.id === currentLesson.id;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          if (unlocked) {
                            onLessonChange(lesson.id);
                          }
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all",
                          "flex items-start gap-3",
                          isCurrent
                            ? "border-primary bg-primary/5"
                            : unlocked
                            ? "border-border hover:bg-muted/50"
                            : "border-border/50 bg-muted/30 opacity-60 cursor-not-allowed"
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : pending ? (
                            <PlayCircle className="h-5 w-5 text-yellow-600" />
                          ) : unlocked ? (
                            <PlayCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                            <span className="font-medium text-base break-words">{lesson.title}</span>
                            {isFinalExamLesson(lesson) && (
                              <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary text-xs self-start sm:self-center">
                                Final
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-0.5">Module {lesson.step_number}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs sm:text-sm text-muted-foreground">
              {completedOrPendingCount} of {totalLessons} lessons
            </span>
          </div>
          <Progress value={progress} className="h-2" />

          {isCourseCompleted && (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-lg bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-2 border-primary/20">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">🎓 Course Completed!</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {canViewCertificate 
                      ? "Congratulations! You've successfully completed all lessons and passed the final exam. View your certificate below."
                      : "Congratulations! You've successfully completed all lessons. Complete the final exam to unlock your certificate."}
                  </p>
                </div>
                {canViewCertificate && (
                  <Button 
                    size="default"
                    onClick={() => {
                      window.location.href = `/courses/${course.slug}/certificate`;
                    }}
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    View Certificate
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 min-w-0">
            <Card className="mb-4 sm:mb-6 overflow-hidden shadow-sm">
              <CardContent className="p-4 sm:p-5 lg:p-6 overflow-x-hidden">
                <div className="mb-4 sm:mb-5 overflow-x-hidden">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Module {currentLesson.step_number}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words leading-tight">{currentLesson.title}</h1>
                    {isFinalExamLesson(currentLesson) && (
                      <Badge variant="outline" className="bg-primary/10 text-primary self-start sm:self-center shrink-0 text-sm">
                        <Trophy className="h-3.5 w-3.5 mr-1" />
                        Final Exam
                      </Badge>
                    )}
                  </div>
                  {currentLesson.description && (
                    <p className="text-base sm:text-lg text-muted-foreground mt-2 break-words leading-relaxed">{currentLesson.description}</p>
                  )}
                </div>

                {!isUnlocked ? (
                  <div className="py-12 text-center border border-border rounded-lg bg-muted/50">
                    <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Lesson Locked</h3>
                    <p className="text-muted-foreground mb-4">
                      Complete the previous lesson to unlock this one.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 overflow-x-hidden">
                    <LessonContent
                      lesson={currentLesson}
                      isCompleted={isCompleted}
                      onComplete={() => handleComplete(currentLesson.id)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handlePreviousLesson}
                disabled={currentStepIndex === 0}
                className="w-full sm:w-auto shrink-0 h-11 text-base"
                size="lg"
              >
                Previous
              </Button>
              <div className="text-sm text-muted-foreground text-center sm:text-left shrink-0 py-2">
                Lesson {currentStepIndex + 1} of {totalLessons}
              </div>
              <Button
                onClick={handleNextLesson}
                disabled={!canProceed}
                className="w-full sm:w-auto shrink-0 h-11 text-base"
                size="lg"
              >
                Next Lesson
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Sidebar - Course Navigation (Hidden on mobile, shown in drawer) */}
          <div className="hidden lg:block lg:col-span-4">
            <Card className="sticky top-24 shadow-sm">
              <CardContent className="p-4 lg:p-6">
                {/* Course Stats */}
                {(course.enrollment_count !== undefined || course.rating !== undefined) && (
                  <div className="mb-6 pb-6 border-b border-border">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {course.rating !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-foreground">{course.rating.toFixed(1)}</span>
                          {course.total_ratings !== undefined && (
                            <span className="text-xs">({course.total_ratings})</span>
                          )}
                        </div>
                      )}
                      {course.enrollment_count !== undefined && (
                        <EnrollmentCount courseId={course.id} initialCount={course.enrollment_count} />
                      )}
                    </div>
                  </div>
                )}
                <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Curriculum
                </h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {lessons.map((lesson, index) => {
                    const unlocked = isLessonUnlocked(lesson, index);
                    const completed = completedLessons.has(lesson.id);
                    const pending = pendingReviewLessons?.has(lesson.id) === true;
                    const isCurrent = lesson.id === currentLesson.id;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          if (unlocked) {
                            onLessonChange(lesson.id);
                          }
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all",
                          "flex items-start gap-3",
                          isCurrent
                            ? "border-primary bg-primary/5 shadow-sm"
                            : unlocked
                            ? "border-border hover:bg-muted/50"
                            : "border-border/50 bg-muted/30 opacity-60 cursor-not-allowed"
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : pending ? (
                            <PlayCircle className="h-5 w-5 text-yellow-600" />
                          ) : unlocked ? (
                            <PlayCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                            <span className="font-medium text-base break-words">{lesson.title}</span>
                            {isFinalExamLesson(lesson) && (
                              <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary text-xs self-start sm:self-center">
                                Final
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-0.5">Module {lesson.step_number}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}









