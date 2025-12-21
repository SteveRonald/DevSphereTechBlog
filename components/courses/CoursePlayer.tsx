"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Lock, PlayCircle, ChevronRight, Trophy, Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CelebrationAnimation } from "./CelebrationAnimation";
import { LessonContent } from "./LessonContent";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  slug: string;
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
  onLessonComplete: (lessonId: string) => void;
  onLessonChange: (lessonId: string) => void;
}

export function CoursePlayer({
  course,
  lessons,
  currentLesson,
  currentStepIndex,
  completedLessons,
  onLessonComplete,
  onLessonChange,
}: CoursePlayerProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  // Calculate progress
  const totalLessons = lessons.length;
  const completedCount = completedLessons.size;
  const progress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  // Check if a lesson is unlocked
  const isLessonUnlocked = (lesson: Lesson, index: number) => {
    if (index === 0) return true; // First lesson is always unlocked
    if (lesson.is_preview) return true; // Preview lessons are always unlocked
    // Lesson is unlocked if previous lesson is completed
    const previousLesson = lessons[index - 1];
    return completedLessons.has(previousLesson.id);
  };

  const handleComplete = (lessonId: string) => {
    if (!completedLessons.has(lessonId)) {
      onLessonComplete(lessonId);
      setJustCompleted(lessonId);
      setShowCelebration(true);
      
      // Hide celebration after animation
      setTimeout(() => {
        setShowCelebration(false);
        setJustCompleted(null);
      }, 3000);
    }
  };

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
  const canProceed = isCompleted && currentStepIndex < lessons.length - 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Celebration Animation Overlay */}
      {showCelebration && <CelebrationAnimation />}

      {/* Progress Bar */}
      <div className="sticky top-16 z-10 bg-background border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Course Progress</span>
              <Badge variant="outline">{Math.round(progress)}%</Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {totalLessons} lessons completed
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Step {currentLesson.step_number}</Badge>
                      <Badge variant="outline">{currentLesson.content_type}</Badge>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold">{currentLesson.title}</h1>
                    {currentLesson.description && (
                      <p className="text-muted-foreground mt-2">{currentLesson.description}</p>
                    )}
                  </div>
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
                  <div className="mt-6">
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
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousLesson}
                disabled={currentStepIndex === 0}
              >
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Lesson {currentStepIndex + 1} of {totalLessons}
              </div>
              <Button
                onClick={handleNextLesson}
                disabled={!canProceed}
              >
                Next Lesson
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Sidebar - Course Navigation */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Course Curriculum</h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {lessons.map((lesson, index) => {
                    const unlocked = isLessonUnlocked(lesson, index);
                    const completed = completedLessons.has(lesson.id);
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
                          "flex items-center gap-3",
                          isCurrent
                            ? "border-primary bg-primary/5"
                            : unlocked
                            ? "border-border hover:bg-muted/50"
                            : "border-border/50 bg-muted/30 opacity-60 cursor-not-allowed"
                        )}
                      >
                        <div className="flex-shrink-0">
                          {completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : unlocked ? (
                            <PlayCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              {lesson.step_number}
                            </span>
                            <span className="text-sm font-medium truncate">{lesson.title}</span>
                          </div>
                          {lesson.duration && (
                            <span className="text-xs text-muted-foreground">
                              {lesson.duration} min
                            </span>
                          )}
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

