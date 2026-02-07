"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Users, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CoursePreviewModal } from "./CoursePreviewModal";
import { Progress } from "@/components/ui/progress";

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  thumbnail_url?: string;
  instructor_id?: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_duration?: number;
  category?: string;
  enrollment_count: number;
  rating: number;
  total_ratings: number;
  created_at: string;
}

interface CourseCardProps {
  course: Course;
  enrolled?: boolean;
  progress?: number;
}

const difficultyColors = {
  beginner: "bg-green-500/10 text-green-600 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-600 border-red-500/20",
};

const difficultyLabels = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function CourseCard({ course, enrolled = false, progress = 0 }: CourseCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm hover:border-primary/30">
      <Link href={`/courses/${course.slug}`}>
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
              <PlayCircle className="h-16 w-16 text-primary/40" />
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {enrolled && (
            <div className="absolute top-3 right-3">
              <Badge variant="default" className="bg-primary shadow-lg">
                Enrolled
              </Badge>
            </div>
          )}

          <div className="absolute bottom-3 left-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 px-3 text-xs font-google-sans font-medium shadow-md hover:shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPreviewOpen(true);
              }}
            >
              Quick View
            </Button>
          </div>
        </div>
      </Link>

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link href={`/courses/${course.slug}`} className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors font-google-sans leading-tight">
              {course.title}
            </h3>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 font-google-sans leading-relaxed">
          {course.short_description || course.description || "No description available"}
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline" className={`font-google-sans font-medium ${difficultyColors[course.difficulty_level]}`}>
            {difficultyLabels[course.difficulty_level]}
          </Badge>
          {course.category && (
            <Badge variant="outline" className="text-xs font-google-sans">
              {course.category}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium font-google-sans">{course.rating.toFixed(1)}</span>
            <span className="text-xs">({course.total_ratings})</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="font-google-sans">{course.enrollment_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="font-google-sans">{formatDuration(course.estimated_duration)}</span>
          </div>
        </div>

        {enrolled && progress > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 font-google-sans">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Link href={`/courses/${course.slug}`} className="w-full">
          <Button className="w-full h-11 text-base font-google-sans font-semibold shadow-sm hover:shadow-md transition-all duration-300">
            {enrolled ? "Continue Learning" : "Start Learning"}
          </Button>
        </Link>
      </CardFooter>

      <CoursePreviewModal slug={course.slug} open={previewOpen} onOpenChange={setPreviewOpen} />
    </Card>
  );
}









