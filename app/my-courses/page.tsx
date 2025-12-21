"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { CourseCard } from "@/components/courses/CourseCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, TrendingUp, Award, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EnrolledCourse {
  id: string;
  course_id: string;
  enrolled_at: string;
  last_accessed_at: string;
  is_completed: boolean;
  courses: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url?: string;
    difficulty_level: string;
    category: string;
    estimated_duration: number;
    enrollment_count: number;
    rating: number;
    total_ratings: number;
  };
  progress: number;
}

export default function MyCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    totalTime: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth?redirect=/my-courses");
    } else if (user) {
      fetchMyCourses();
    }
  }, [user, authLoading, router]);

  const fetchMyCourses = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      
      // Fetch enrolled courses
      const { data: enrollments, error } = await supabase
        .from("user_course_enrollments")
        .select(`
          *,
          courses (*)
        `)
        .eq("user_id", user.id)
        .order("last_accessed_at", { ascending: false });

      if (error) throw error;

      // Calculate progress for each course
      const coursesWithProgress = await Promise.all(
        (enrollments || []).map(async (enrollment: any) => {
          // Get total lessons
          const { count: totalLessons } = await supabase
            .from("lessons")
            .select("*", { count: "exact", head: true })
            .eq("course_id", enrollment.course_id);

          // Get completed lessons
          const { count: completedLessons } = await supabase
            .from("user_lesson_completion")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("course_id", enrollment.course_id);

          const progress = totalLessons && totalLessons > 0
            ? (completedLessons || 0) / totalLessons * 100
            : 0;

          return {
            ...enrollment,
            progress: Math.round(progress),
          };
        })
      );

      setEnrolledCourses(coursesWithProgress);

      // Calculate stats
      const completed = coursesWithProgress.filter((c) => c.is_completed).length;
      const inProgress = coursesWithProgress.filter((c) => !c.is_completed).length;
      
      // Calculate total time spent (sum of estimated durations of completed courses)
      const totalTime = coursesWithProgress
        .filter((c) => c.is_completed)
        .reduce((sum, c) => sum + (c.courses.estimated_duration || 0), 0);

      setStats({
        total: coursesWithProgress.length,
        inProgress,
        completed,
        totalTime,
      });
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            My Courses
          </h1>
          <p className="text-muted-foreground">
            Continue your learning journey and track your progress
          </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Award className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Spent</p>
                  <p className="text-2xl font-bold">
                    {Math.round(stats.totalTime / 60)}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses */}
        {enrolledCourses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-4">
                Start learning by enrolling in free courses
              </p>
              <Button asChild>
                <Link href="/free-courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Continue Learning Section */}
            {enrolledCourses.filter((c) => !c.is_completed).length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Continue Learning</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses
                    .filter((c) => !c.is_completed)
                    .map((enrollment) => (
                      <Card key={enrollment.id} className="group hover:shadow-lg transition-all">
                        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                          {enrollment.courses.thumbnail_url ? (
                            <img
                              src={enrollment.courses.thumbnail_url}
                              alt={enrollment.courses.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                              <BookOpen className="h-12 w-12 text-primary/50" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-2">
                            {enrollment.courses.title}
                          </h3>
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Progress</span>
                              <span>{enrollment.progress}%</span>
                            </div>
                            <Progress value={enrollment.progress} className="h-2" />
                          </div>
                          <Button className="w-full" asChild>
                            <Link href={`/courses/${enrollment.courses.slug}/learn`}>
                              Continue Learning
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Completed Courses */}
            {enrolledCourses.filter((c) => c.is_completed).length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Completed Courses</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses
                    .filter((c) => c.is_completed)
                    .map((enrollment) => (
                      <Card key={enrollment.id} className="group hover:shadow-lg transition-all">
                        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                          {enrollment.courses.thumbnail_url ? (
                            <img
                              src={enrollment.courses.thumbnail_url}
                              alt={enrollment.courses.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                              <BookOpen className="h-12 w-12 text-primary/50" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                              Completed
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-2">
                            {enrollment.courses.title}
                          </h3>
                          <Button variant="outline" className="w-full" asChild>
                            <Link href={`/courses/${enrollment.courses.slug}`}>
                              View Certificate
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

