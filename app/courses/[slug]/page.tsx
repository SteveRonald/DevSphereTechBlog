import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users, Star, PlayCircle, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

async function getCourse(slug: string) {
  const supabase = createServerClient(undefined);
  
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !course) {
    return null;
  }

  return course;
}

async function getLessons(courseId: string) {
  const supabase = createServerClient(undefined);
  
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("step_number", { ascending: true });

  if (error) {
    console.error("Error fetching lessons:", error);
    return [];
  }

  return lessons || [];
}

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) {
    notFound();
  }

  const lessons = await getLessons(course.id);

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

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hour${hours > 1 ? "s" : ""} ${mins} minute${mins > 1 ? "s" : ""}` : `${hours} hour${hours > 1 ? "s" : ""}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Course Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              {course.thumbnail_url ? (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <PlayCircle className="h-24 w-24 text-primary/50" />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={difficultyColors[course.difficulty_level]}>
                  {difficultyLabels[course.difficulty_level]}
                </Badge>
                {course.category && (
                  <Badge variant="outline">{course.category}</Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {course.title}
              </h1>
              <p className="text-muted-foreground text-lg">
                {course.description || course.short_description}
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{course.rating.toFixed(1)}</span>
                  <span>({course.total_ratings} ratings)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course.enrollment_count} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(course.estimated_duration)}</span>
                </div>
              </div>
              <div className="pt-4">
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link href={`/courses/${slug}/learn`}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Learning - Free
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Course Curriculum</h2>
                <div className="space-y-2">
                  {lessons.length > 0 ? (
                    lessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {index === 0 ? (
                            <PlayCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-muted-foreground">
                              Step {lesson.step_number}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {lesson.content_type}
                            </Badge>
                          </div>
                          <h3 className="font-semibold">{lesson.title}</h3>
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                        {lesson.duration && (
                          <div className="text-sm text-muted-foreground">
                            {lesson.duration}m
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No lessons available yet. Check back soon!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-6">
              <div className="border border-border rounded-lg p-6 bg-card">
                <h3 className="font-semibold mb-4">What you'll learn</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Master the fundamentals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Build real-world projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Get hands-on experience</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

