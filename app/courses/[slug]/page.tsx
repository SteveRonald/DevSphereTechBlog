import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users, Star, PlayCircle, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { CourseRating } from "@/components/courses/CourseRating";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  difficulty_level: DifficultyLevel;
  estimated_duration: number | null;
  category: string | null;
  is_published: boolean;
  enrollment_count: number;
  rating: number;
  total_ratings: number;
}

interface Lesson {
  id: string;
  course_id: string;
  step_number: number;
  title: string;
  description: string | null;
  content_type: string;
  duration: number | null;
}

// Use dynamic rendering to ensure enrollment status is always fresh
export const dynamic = 'force-dynamic';

async function getCourse(slug: string): Promise<Course | null> {
  const supabase = await createServerClient(undefined);
  
  // Fetch course data
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !course) {
    return null;
  }

  return {
    ...course,
    enrollment_count: course.enrollment_count || 0,
  } as Course;
}

async function getLessons(courseId: string): Promise<Lesson[]> {
  const supabase = await createServerClient(undefined);
  
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("step_number", { ascending: true });

  if (error) {
    console.error("Error fetching lessons:", error);
    return [];
  }

  return (lessons || []) as Lesson[];
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

  // Check if user is enrolled - always fetch fresh data (no cache)
  const supabase = await createServerClient(undefined);
  let isEnrolled = false;
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (user && !userError) {
      // Query enrollment for this specific course and user
      const { data: enrollment, error: enrollmentError } = await supabase
        .from("user_course_enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
        .maybeSingle();
      
      if (!enrollmentError && enrollment) {
        isEnrolled = true;
      }
    }
  } catch (error) {
    // User not logged in or error - default to not enrolled
    console.error("Error checking enrollment:", error);
    isEnrolled = false;
  }

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

  const formatDuration = (minutes?: number | null) => {
    if (minutes == null) return "N/A";
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
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400 shrink-0" />
                  <span className="font-medium text-base sm:text-sm">{course.rating.toFixed(1)}</span>
                  <span className="text-xs sm:text-sm">({course.total_ratings} ratings)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="text-base sm:text-sm">{course.enrollment_count} students</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="text-base sm:text-sm break-words">{formatDuration(course.estimated_duration)}</span>
                </div>
              </div>
              <div className="pt-4">
                <Button size="lg" className="w-full sm:w-auto text-base h-11" asChild>
                  <Link href={`/courses/${slug}/learn`}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {isEnrolled ? "Continue Learning" : "Start Learning - Free"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About This Course */}
            <section>
              <h2 className="text-2xl font-bold mb-4 font-google-sans flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                About This Course
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-foreground/80 dark:text-foreground/90 leading-relaxed">
                  {course.description || course.short_description || "This course will teach you essential skills and practical knowledge to advance your learning journey."}
                </p>
              </div>
            </section>


            {/* Course Content */}
            <section>
              <h2 className="text-2xl font-bold mb-4 font-google-sans flex items-center gap-2">
                <PlayCircle className="h-6 w-6 text-primary" />
                Course Content
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'} • {lessons.reduce((acc, l) => acc + (l.duration || 0), 0)} min total
              </p>
              <div className="space-y-2">
                {lessons.length > 0 ? (
                  lessons.map((lesson: Lesson, index: number) => (
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
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          Day {lesson.step_number}
                        </p>
                        <h3 className="font-semibold text-foreground dark:text-foreground truncate">{lesson.title}</h3>
                      </div>
                      {lesson.duration && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-4 w-4" />
                          {lesson.duration} min
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
            </section>

            {/* Requirements */}
            <section>
              <h2 className="text-2xl font-bold mb-4 font-google-sans">Requirements</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-foreground/80 dark:text-foreground/90">
                  <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                  <span>A smartphone, tablet, or computer</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground/80 dark:text-foreground/90">
                  <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                  <span>Stable internet connection</span>
                </li>
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary mb-2">Free</div>
                  <p className="text-sm text-muted-foreground">Lifetime access - Certificate included</p>
                </div>
                <Button size="lg" className="w-full mb-4" asChild>
                  <Link href={`/courses/${slug}/learn`}>
                    {isEnrolled ? "Continue Learning" : "Enroll Now — Free"}
                  </Link>
                </Button>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(course.estimated_duration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{course.enrollment_count} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating.toFixed(1)} ({course.total_ratings} ratings)</span>
                  </div>
                </div>
              </div>
              <CourseRating
                courseId={course.id}
                courseSlug={course.slug}
                currentRating={course.rating}
                totalRatings={course.total_ratings}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

