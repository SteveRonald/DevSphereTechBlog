"use client";

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, BookOpen, Plus, Edit, Trash2, Eye, Settings, Users, TrendingUp, Award } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { CourseForm } from "@/components/admin/CourseForm";
import { LessonManager } from "@/components/admin/LessonManager";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { AdminShell } from "@/components/admin/AdminShell";

type AnalyticsPoint = {
  date: string;
  courses_created: number;
  enrollments: number;
  completions: number;
};

interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  thumbnail_url?: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_duration: number;
  category: string;
  is_published: boolean;
  enrollment_count: number;
  rating: number;
  total_ratings: number;
  created_at: string;
}

export default function AdminCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsPoint[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    students: 0,
    completionRate: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/auth?redirect=/admin-courses-management");
    }
  }, [user, authLoading, router, mounted]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || authLoading) {
        setCheckingAdmin(true);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            await new Promise(resolve => setTimeout(resolve, 500));
            const retry = await supabase
              .from("user_profiles")
              .select("is_admin")
              .eq("id", user.id)
              .single();
            
            if (retry.error && retry.error.code !== "PGRST116") {
              setIsAdmin(false);
            } else {
              setIsAdmin(retry.data?.is_admin === true);
            }
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(data?.is_admin === true);
        }
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (mounted && user && !authLoading) {
      checkAdmin();
    } else if (mounted && !user && !authLoading) {
      setCheckingAdmin(false);
    }
  }, [user, mounted, authLoading]);

  useEffect(() => {
    if (isAdmin === true) {
      fetchCourses();
      fetchStats();
      fetchAnalytics();
    }
  }, [isAdmin]);

  const fetchCourses = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setCourses([]);
        return;
      }

      // Fetch all enrollments to get real-time counts for all courses at once
      // This is more efficient than querying each course individually
      const courseIds = data.map((c: AdminCourse) => c.id);
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("user_course_enrollments")
        .select("course_id")
        .in("course_id", courseIds);

      // Count enrollments per course
      const enrollmentCounts = new Map<string, number>();
      if (!enrollmentsError && enrollments) {
        enrollments.forEach((enrollment: any) => {
          const courseId = enrollment.course_id;
          enrollmentCounts.set(courseId, (enrollmentCounts.get(courseId) || 0) + 1);
        });
      }

      // Map real-time enrollment counts to courses
      const coursesWithRealCounts = data.map((course: AdminCourse) => ({
        ...course,
        enrollment_count: enrollmentCounts.get(course.id) || 0,
      }));

      setCourses(coursesWithRealCounts);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/analytics?days=30", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load analytics");
      }

      setAnalytics(data.series || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchStats = async () => {
    try {
      const supabase = createClient();
      
      // Total courses
      const { count: totalCount } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true });

      // Published courses
      const { count: publishedCount } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);

      // Total enrollments
      const { count: enrollmentsCount } = await supabase
        .from("user_course_enrollments")
        .select("*", { count: "exact", head: true });

      // Completion rate (completed enrollments / total enrollments)
      const { count: completedCount } = await supabase
        .from("user_course_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("is_completed", true);

      const completionRate = enrollmentsCount && enrollmentsCount > 0
        ? Math.round((completedCount || 0) / enrollmentsCount * 100)
        : 0;

      setStats({
        total: totalCount || 0,
        published: publishedCount || 0,
        students: enrollmentsCount || 0,
        completionRate,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingCourseId(courseId);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete course");
      }

      toast({
        title: "Success",
        description: "Course deleted successfully",
      });

      fetchCourses();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete course",
        variant: "destructive",
      });
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleFormSuccess = () => {
    fetchCourses();
    fetchStats();
    setEditingCourse(null);
    setShowCourseForm(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const showShellLoading = !mounted || authLoading || checkingAdmin;
  const showAccessDenied = mounted && !authLoading && !checkingAdmin && isAdmin === false;
  const showContentLoading = mounted && !authLoading && !checkingAdmin && isAdmin === true && loading;

  return (
    <AdminShell
      title="Admin Dashboard"
      subtitle="Courses management system"
      userEmail={user?.email}
      userName={user?.email}
      onSignOut={handleSignOut}
    >
      {showShellLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : showAccessDenied ? (
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-6 w-6 text-destructive" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>This page is restricted to administrators only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need administrator privileges to access the Courses Management Dashboard.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/")} className="flex-1">
                Go Home
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="flex-1">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.published} published</p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.students}</div>
                <p className="text-xs text-muted-foreground mt-1">Active learners</p>
              </CardContent>
            </Card>

            <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.completionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">Average completion</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
                <Award className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.published}</div>
                <p className="text-xs text-muted-foreground mt-1">Live courses</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Analytics (Last 30 days)</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchAnalytics()}
                disabled={loadingAnalytics}
              >
                {loadingAnalytics ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <ChartContainer
                  className="h-[280px] w-full"
                  config={{
                    enrollments: { label: "Enrollments", color: "hsl(var(--primary))" },
                    completions: { label: "Completions", color: "hsl(var(--chart-2))" },
                  }}
                >
                  <AreaChart data={analytics} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                    <Area
                      dataKey="enrollments"
                      type="monotone"
                      fill="var(--color-enrollments)"
                      fillOpacity={0.15}
                      stroke="var(--color-enrollments)"
                      strokeWidth={2}
                    />
                    <Area
                      dataKey="completions"
                      type="monotone"
                      fill="var(--color-completions)"
                      fillOpacity={0.12}
                      stroke="var(--color-completions)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">All Courses</h2>
              <p className="text-muted-foreground">Manage and organize your course content</p>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => {
                setEditingCourse(null);
                setShowCourseForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create New Course
            </Button>
          </div>

        {/* Courses List */}
        {showContentLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading courses...</p>
            </CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No courses yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first course to get started
              </p>
              <Button onClick={() => {
                setEditingCourse(null);
                setShowCourseForm(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="group hover:shadow-lg transition-all duration-300">
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
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
                      <BookOpen className="h-12 w-12 text-primary/50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {course.is_published ? (
                      <Badge className="bg-green-500">Published</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.short_description || course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge variant="outline">{course.difficulty_level}</Badge>
                    <Badge variant="outline">{course.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{course.enrollment_count} students</span>
                    <span>{course.estimated_duration} min</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedCourse(course)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Lessons
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCourse(course);
                        setShowCourseForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(course.id)}
                      className="text-destructive hover:text-destructive"
                      disabled={deletingCourseId === course.id}
                      aria-label={deletingCourseId === course.id ? "Deleting course" : "Delete course"}
                    >
                      {deletingCourseId === course.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="sr-only">Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/courses/${course.slug}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          {/* Course Form Modal */}
          {showCourseForm && (
            <CourseForm
              course={
                editingCourse
                  ? {
                      ...editingCourse,
                      thumbnail_url: editingCourse.thumbnail_url || "",
                    }
                  : null
              }
              onClose={() => {
                setShowCourseForm(false);
                setEditingCourse(null);
              }}
              onSuccess={handleFormSuccess}
            />
          )}

          {/* Lesson Manager Modal */}
          {selectedCourse && (
            <LessonManager
              course={{
                id: selectedCourse.id,
                title: selectedCourse.title,
                is_published: selectedCourse.is_published,
              }}
              onClose={() => setSelectedCourse(null)}
              onSuccess={() => {
                void fetchCourses();
              }}
            />
          )}
        </>
      )}
    </AdminShell>
  );
}
