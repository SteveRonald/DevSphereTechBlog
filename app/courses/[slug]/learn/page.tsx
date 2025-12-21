"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { CoursePlayer } from "@/components/courses/CoursePlayer";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

interface Course {
  id: string;
  title: string;
  slug: string;
}

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  const slug = params?.slug as string;

  useEffect(() => {
    if (!slug) return;

    const fetchCourseData = async () => {
      try {
        const supabase = createClient();

        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("*")
          .eq("slug", slug)
          .eq("is_published", true)
          .single();

        if (courseError || !courseData) {
          router.push("/free-courses");
          return;
        }

        setCourse(courseData);

        // Fetch lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("lessons")
          .select("*")
          .eq("course_id", courseData.id)
          .order("step_number", { ascending: true });

        if (lessonsError) {
          console.error("Error fetching lessons:", lessonsError);
        } else {
          setLessons(lessonsData || []);
          // Set first lesson as current if available
          if (lessonsData && lessonsData.length > 0) {
            setCurrentLessonId(lessonsData[0].id);
          }
        }

        // Check enrollment and progress if user is logged in
        if (user) {
          const { data: enrollment } = await supabase
            .from("user_course_enrollments")
            .select("*")
            .eq("user_id", user.id)
            .eq("course_id", courseData.id)
            .single();

          if (enrollment) {
            setEnrolled(true);
          }

          // Fetch completed lessons
          const { data: completions } = await supabase
            .from("user_lesson_completion")
            .select("lesson_id")
            .eq("user_id", user.id)
            .eq("course_id", courseData.id);

          if (completions) {
            setCompletedLessons(new Set(completions.map((c) => c.lesson_id)));
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [slug, user, router]);

  const handleEnroll = async () => {
    if (!user) {
      router.push(`/auth?redirect=/courses/${slug}/learn`);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("user_course_enrollments")
        .insert({
          user_id: user.id,
          course_id: course?.id,
        });

      if (error) {
        console.error("Error enrolling:", error);
      } else {
        setEnrolled(true);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleLessonComplete = async (lessonId: string) => {
    if (!user || !course) return;

    try {
      const supabase = createClient();

      // Mark lesson as complete
      const { error } = await supabase
        .from("user_lesson_completion")
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          course_id: course.id,
        });

      if (error && error.code !== "23505") {
        // Ignore duplicate key errors
        console.error("Error completing lesson:", error);
      } else {
        setCompletedLessons((prev) => new Set([...prev, lessonId]));

        // Unlock next lesson
        const currentLesson = lessons.find((l) => l.id === lessonId);
        if (currentLesson) {
          const nextLesson = lessons.find(
            (l) => l.step_number === currentLesson.step_number + 1
          );
          // Next lesson is automatically unlocked by completing current one
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course || lessons.length === 0) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Course not found or no lessons available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user needs to enroll
  if (!enrolled && user) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <h2 className="text-2xl font-bold">Enroll in {course.title}</h2>
            <p className="text-muted-foreground">
              Enroll now to start learning with step-by-step progression!
            </p>
            <button
              onClick={handleEnroll}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Enroll Now - Free
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <h2 className="text-2xl font-bold">Sign In Required</h2>
            <p className="text-muted-foreground">
              Please sign in to access this course.
            </p>
            <button
              onClick={() => router.push(`/auth?redirect=/courses/${slug}/learn`)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Sign In
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLesson = lessons.find((l) => l.id === currentLessonId);
  const currentStepIndex = lessons.findIndex((l) => l.id === currentLessonId);

  return (
    <CoursePlayer
      course={course}
      lessons={lessons}
      currentLesson={currentLesson || null}
      currentStepIndex={currentStepIndex}
      completedLessons={completedLessons}
      onLessonComplete={handleLessonComplete}
      onLessonChange={setCurrentLessonId}
    />
  );
}

