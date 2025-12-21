import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Users, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border overflow-hidden">
      <Link href={`/courses/${course.slug}`}>
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <PlayCircle className="h-16 w-16 text-primary/50" />
            </div>
          )}
          {enrolled && (
            <div className="absolute top-2 right-2">
              <Badge variant="default" className="bg-primary">
                Enrolled
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/courses/${course.slug}`}>
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {course.short_description || course.description || "No description available"}
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline" className={difficultyColors[course.difficulty_level]}>
            {difficultyLabels[course.difficulty_level]}
          </Badge>
          {course.category && (
            <Badge variant="outline" className="text-xs">
              {course.category}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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

        {enrolled && progress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Link href={`/courses/${course.slug}`} className="w-full">
          <Button className="w-full" variant={enrolled ? "outline" : "default"}>
            {enrolled ? "Continue Learning" : "Enroll Now"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

