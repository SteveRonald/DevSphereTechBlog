"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, Star, PlayCircle, Lock } from "lucide-react";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface PreviewCourse {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  thumbnail_url?: string | null;
  difficulty_level: DifficultyLevel;
  estimated_duration?: number | null;
  category?: string | null;
  enrollment_count: number;
  rating: number;
  total_ratings: number;
}

interface PreviewLesson {
  id: string;
  step_number: number;
  title: string;
  content_type: string;
  duration?: number | null;
  is_preview: boolean;
}

export function CoursePreviewModal({
  slug,
  open,
  onOpenChange,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<PreviewCourse | null>(null);
  const [lessons, setLessons] = useState<PreviewLesson[]>([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses/preview?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load course preview");
        }
        if (cancelled) return;
        setCourse(data.course);
        setLessons(data.lessons || []);
      } catch {
        if (!cancelled) {
          setCourse(null);
          setLessons([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [open, slug]);

  const formatDuration = (minutes?: number | null) => {
    if (minutes == null) return "N/A";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const difficultyColors = {
    beginner: "bg-green-500/10 text-green-600 border-green-500/20",
    intermediate: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    advanced: "bg-red-500/10 text-red-600 border-red-500/20",
  } satisfies Record<DifficultyLevel, string>;

  const difficultyLabels = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  } satisfies Record<DifficultyLevel, string>;

  const title = useMemo(() => course?.title || "Course Preview", [course?.title]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Preview the curriculum and course details before you enroll.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Loading preview...</div>
        ) : !course ? (
          <div className="py-10 text-center text-muted-foreground">Course preview unavailable.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <PlayCircle className="h-14 w-14 text-primary/50" />
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={difficultyColors[course.difficulty_level]}>
                  {difficultyLabels[course.difficulty_level]}
                </Badge>
                {course.category && <Badge variant="outline">{course.category}</Badge>}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{course.rating.toFixed(1)}</span>
                  <span className="text-xs">({course.total_ratings})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course.enrollment_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(course.estimated_duration)}</span>
                </div>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                {course.short_description || course.description || "No description available"}
              </p>

              <div className="mt-6 flex flex-col gap-2">
                <Button asChild>
                  <Link href={`/courses/${course.slug}`}>View Course</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/courses/${course.slug}/learn`}>Start Learning</Link>
                </Button>
              </div>
            </div>

            <div className="md:col-span-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Curriculum Preview</h3>
                    <span className="text-xs text-muted-foreground">{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="space-y-2">
                    {lessons.map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between rounded-md border border-border p-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Module {l.step_number}</span>
                            {l.is_preview && <Badge variant="outline" className="text-xs">Preview</Badge>}
                          </div>
                          <p className="font-medium truncate mt-1">{l.title}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {l.duration != null && (
                            <span className="text-xs text-muted-foreground">{l.duration}m</span>
                          )}
                          {l.step_number === 1 || l.is_preview ? (
                            <PlayCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
