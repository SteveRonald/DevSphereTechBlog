"use client";

import { useCallback, useEffect, useMemo, useState, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  BookOpen,
  FileText,
  PlayCircle,
  Trophy,
  Target,
  BarChart3,
  Calendar,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { DashboardErrorBoundary } from "@/components/dashboard/ErrorBoundary";
import { DashboardSkeleton, CourseCardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { CourseSearchFilter } from "@/components/dashboard/CourseSearchFilter";

type DashboardCourseRow = {
  enrollment: any;
  progress: number;
  grades: {
    cat_scaled_30: number;
    exam_scaled_70: number;
    final_score_100: number;
    has_final_exam: boolean;
    final_exam_pending_review: boolean;
    final_exam_graded: boolean;
  };
  eligibleToComplete: boolean;
  passed: boolean;
};

type PendingSubmission = {
  id: string;
  type: "quiz" | "project";
  course_id: string;
  course_title: string;
  course_slug: string;
  lesson_id: string;
  lesson_title: string;
  submitted_at: string;
  status: "pending_review";
};

type SortOption = "progress-desc" | "progress-asc" | "name-asc" | "name-desc" | "date-desc" | "date-asc";
type FilterOption = "all" | "in-progress" | "completed" | "passed" | "failed" | "pending-review";

const COURSES_PER_PAGE = 6;

export default function StudentDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<DashboardCourseRow[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "activities">("overview");
  
  // Search, filter, sort, and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("progress-desc");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/auth?redirect=/dashboard");
    }
  }, [user, authLoading, router, mounted]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Load dashboard data
      const res = await fetch("/api/student/dashboard", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load dashboard");
      }

      const coursesData = Array.isArray(data?.courses) ? data.courses : [];
      setRows(coursesData);

      // Load pending submissions
      const courseIds = coursesData.map((r: any) => r.enrollment?.course_id).filter(Boolean);
      
      if (courseIds.length > 0) {
        const [quizRes, projectRes, coursesData, lessonsData] = await Promise.all([
          supabase
            .from("lesson_quiz_submissions")
            .select("id, course_id, lesson_id, submitted_at, status")
            .eq("user_id", user?.id)
            .in("course_id", courseIds)
            .eq("status", "pending_review")
            .order("submitted_at", { ascending: false })
            .limit(10),
          supabase
            .from("lesson_project_submissions")
            .select("id, course_id, lesson_id, submitted_at, status")
            .eq("user_id", user?.id)
            .in("course_id", courseIds)
            .eq("status", "pending_review")
            .order("submitted_at", { ascending: false })
            .limit(10),
          supabase
            .from("courses")
            .select("id, title, slug")
            .in("id", courseIds),
          supabase
            .from("lessons")
            .select("id, title, course_id")
            .in("course_id", courseIds),
        ]);

        type CourseInfo = { id: string; title: string; slug: string };
        type LessonInfo = { id: string; title: string; course_id: string };
        
        const coursesMap = new Map<string, CourseInfo>(
          (coursesData.data || []).map((c: CourseInfo) => [c.id, c])
        );
        const lessonsMap = new Map<string, LessonInfo>(
          (lessonsData.data || []).map((l: LessonInfo) => [l.id, l])
        );

        const submissions: PendingSubmission[] = [];
        
        (quizRes.data || []).forEach((s: any) => {
          const course = coursesMap.get(s.course_id);
          const lesson = lessonsMap.get(s.lesson_id);
          submissions.push({
            id: s.id,
            type: "quiz",
            course_id: s.course_id,
            course_title: course?.title || "Course",
            course_slug: course?.slug || "",
            lesson_id: s.lesson_id,
            lesson_title: lesson?.title || "Lesson",
            submitted_at: s.submitted_at,
            status: s.status,
          });
        });

        (projectRes.data || []).forEach((s: any) => {
          const course = coursesMap.get(s.course_id);
          const lesson = lessonsMap.get(s.lesson_id);
          submissions.push({
            id: s.id,
            type: "project",
            course_id: s.course_id,
            course_title: course?.title || "Course",
            course_slug: course?.slug || "",
            lesson_id: s.lesson_id,
            lesson_title: lesson?.title || "Lesson",
            submitted_at: s.submitted_at,
            status: s.status,
          });
        });

        setPendingSubmissions(submissions);
      } else {
        setPendingSubmissions([]);
      }
    } catch (e: any) {
      const errorMessage = e?.message || "Failed to load dashboard";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (mounted && !authLoading && user) {
      void load();
    }
  }, [mounted, authLoading, user?.id, load]);

  const stats = useMemo(() => {
    const total = rows.length;
    const inProgress = rows.filter((r) => !r.enrollment?.is_completed && r.progress > 0 && r.progress < 100).length;
    const completed = rows.filter((r) => r.enrollment?.is_completed).length;
    const passed = rows.filter((r) => r.passed).length;
    const eligible = rows.filter((r) => r.eligibleToComplete).length;
    const avgScore = rows.length > 0
      ? rows.reduce((sum, r) => sum + (r.grades?.final_score_100 || 0), 0) / rows.length
      : 0;
    
    return { total, inProgress, completed, passed, eligible, avgScore };
  }, [rows]);

  const recentCourses = useMemo(() => {
    return rows
      .sort((a, b) => {
        const aDate = new Date(a.enrollment?.last_accessed_at || a.enrollment?.enrolled_at || 0).getTime();
        const bDate = new Date(b.enrollment?.last_accessed_at || b.enrollment?.enrolled_at || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 3);
  }, [rows]);

  const coursesNeedingAttention = useMemo(() => {
    return rows.filter((r) => {
      const hasPending = pendingSubmissions.some((s) => s.course_id === r.enrollment?.course_id);
      const needsRetake = r.enrollment?.is_completed && !r.passed;
      const inProgress = r.progress > 0 && r.progress < 100 && !r.enrollment?.is_completed;
      return hasPending || needsRetake || inProgress;
    }).slice(0, 4);
  }, [rows, pendingSubmissions]);

  // Filtered, sorted, and paginated courses
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = rows;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const course = r?.enrollment?.courses;
        return course?.title?.toLowerCase().includes(query) || 
               course?.category?.toLowerCase().includes(query);
      });
    }

    // Apply status filter
    if (filterBy !== "all") {
      filtered = filtered.filter((r) => {
        const hasPending = pendingSubmissions.some((s) => s.course_id === r.enrollment?.course_id);
        switch (filterBy) {
          case "in-progress":
            return !r.enrollment?.is_completed && r.progress > 0 && r.progress < 100;
          case "completed":
            return r.enrollment?.is_completed;
          case "passed":
            return r.passed;
          case "failed":
            return r.enrollment?.is_completed && !r.passed;
          case "pending-review":
            return hasPending;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const courseA = a?.enrollment?.courses;
      const courseB = b?.enrollment?.courses;
      
      switch (sortBy) {
        case "progress-desc":
          return b.progress - a.progress;
        case "progress-asc":
          return a.progress - b.progress;
        case "name-asc":
          return (courseA?.title || "").localeCompare(courseB?.title || "");
        case "name-desc":
          return (courseB?.title || "").localeCompare(courseA?.title || "");
        case "date-desc":
          const aDate = new Date(a.enrollment?.last_accessed_at || a.enrollment?.enrolled_at || 0).getTime();
          const bDate = new Date(b.enrollment?.last_accessed_at || b.enrollment?.enrolled_at || 0).getTime();
          return bDate - aDate;
        case "date-asc":
          const aDateAsc = new Date(a.enrollment?.last_accessed_at || a.enrollment?.enrolled_at || 0).getTime();
          const bDateAsc = new Date(b.enrollment?.last_accessed_at || b.enrollment?.enrolled_at || 0).getTime();
          return aDateAsc - bDateAsc;
        default:
          return 0;
      }
    });

    return filtered;
  }, [rows, searchQuery, filterBy, sortBy, pendingSubmissions]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCourses.length / COURSES_PER_PAGE);
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
    return filteredAndSortedCourses.slice(startIndex, startIndex + COURSES_PER_PAGE);
  }, [filteredAndSortedCourses, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterBy, sortBy]);

  if (!mounted || authLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Student Dashboard
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Track your progress, manage submissions, and continue learning
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => void load()} 
            disabled={loading}
            className="gap-2"
            aria-label="Refresh dashboard data"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            Refresh
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8" role="region" aria-label="Dashboard statistics">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow" role="article" aria-label={`${stats.total} courses enrolled`}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-blue-600 mb-1 truncate">Enrolled</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-700" aria-live="polite">{stats.total}</p>
                </div>
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 opacity-60 shrink-0 ml-2" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-purple-600 mb-1 truncate">In Progress</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-700">{stats.inProgress}</p>
                </div>
                <PlayCircle className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 opacity-60 shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-green-600 mb-1 truncate">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.completed}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 opacity-60 shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-amber-600 mb-1 truncate">Passed</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-700">{stats.passed}</p>
                </div>
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 opacity-60 shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-orange-600 mb-1 truncate">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-700">{pendingSubmissions.length}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 opacity-60 shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-indigo-600 mb-1 truncate">Avg Score</p>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-700">{stats.avgScore.toFixed(0)}%</p>
                </div>
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500 opacity-60 shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto h-auto">
            <TabsTrigger value="overview" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">All Courses</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
              <Target className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Activities</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Pending Submissions */}
                {pendingSubmissions.length > 0 && (
                  <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-transparent">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        Pending Reviews ({pendingSubmissions.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {pendingSubmissions.slice(0, 5).map((submission) => (
                        <div
                          key={submission.id}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-background rounded-lg border border-amber-200 hover:border-amber-300 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs shrink-0">
                                {submission.type === "quiz" ? "Quiz" : "Project"}
                              </Badge>
                              <span className="text-sm font-medium break-words">{submission.lesson_title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{submission.course_title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" asChild className="w-full sm:w-auto shrink-0">
                            <Link href={`/courses/${submission.course_slug}/learn`}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Link>
                          </Button>
                        </div>
                      ))}
                      {pendingSubmissions.length > 5 && (
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("activities")}>
                          View All Pending ({pendingSubmissions.length})
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Courses Needing Attention */}
                {coursesNeedingAttention.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Continue Learning
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {coursesNeedingAttention.map((r) => {
                        const course = r?.enrollment?.courses;
                        const slug = course?.slug;
                        const hasPending = pendingSubmissions.some((s) => s.course_id === r.enrollment?.course_id);
                        const needsRetake = r.enrollment?.is_completed && !r.passed;

                        return (
                          <div
                            key={r.enrollment?.id || slug}
                            className="p-3 sm:p-4 rounded-lg border bg-card hover:shadow-md transition-all overflow-x-hidden"
                          >
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                              {course?.thumbnail_url && (
                                <div className="relative w-full sm:w-24 h-32 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image
                                    src={course.thumbnail_url}
                                    alt={course.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0 overflow-x-hidden">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                  <h3 className="font-semibold text-base sm:text-lg break-words">{course?.title || "Course"}</h3>
                                  <div className="flex flex-wrap gap-2 shrink-0">
                                    {hasPending && (
                                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Review Pending
                                      </Badge>
                                    )}
                                    {needsRetake && (
                                      <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Retake Needed
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {course?.category && (
                                    <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                                  )}
                                  {course?.difficulty_level && (
                                    <Badge variant="secondary" className="text-xs">{course.difficulty_level}</Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {r.progress}% Complete
                                  </Badge>
                                </div>
                                <Progress value={r.progress} className="h-2 mb-3" />
                                <div className="flex flex-wrap gap-2">
                                  {slug && (
                                    <Button size="sm" asChild className="text-xs sm:text-sm h-9">
                                      <Link href={`/courses/${slug}/learn`}>
                                        <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                        Continue
                                      </Link>
                                    </Button>
                                  )}
                                  {needsRetake && slug && (
                                    <Button size="sm" variant="outline" asChild className="bg-amber-50 hover:bg-amber-100 text-xs sm:text-sm h-9">
                                      <Link href={`/courses/${slug}/retake-final-exam`}>
                                        <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                        Retake Exam
                                      </Link>
                                    </Button>
                                  )}
                                  {r.passed && slug && (
                                    <Button size="sm" variant="outline" asChild className="bg-green-50 hover:bg-green-100 text-xs sm:text-sm h-9">
                                      <Link href={`/courses/${slug}/certificate`}>
                                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                        View Certificate
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Recent Courses */}
                {recentCourses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Recently Accessed
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recentCourses.map((r) => {
                        const course = r?.enrollment?.courses;
                        const slug = course?.slug;
                        return (
                          <Link
                            key={r.enrollment?.id || slug}
                            href={slug ? `/courses/${slug}/learn` : "#"}
                            className="block p-3 rounded-lg border bg-card hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                                  {course?.title || "Course"}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Progress value={r.progress} className="h-1.5 flex-1 max-w-[200px]" />
                                  <span className="text-xs text-muted-foreground">{r.progress}%</span>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
                            </div>
                          </Link>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats Summary */}
                <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completion Rate</span>
                        <span className="font-semibold">
                          {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pass Rate</span>
                        <span className="font-semibold">
                          {stats.completed > 0 ? Math.round((stats.passed / stats.completed) * 100) : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={stats.completed > 0 ? (stats.passed / stats.completed) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Average Score</span>
                        <span className="text-lg font-bold text-primary">{stats.avgScore.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/free-courses">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Browse Courses
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/my-courses">
                        <FileText className="h-4 w-4 mr-2" />
                        My Courses
                      </Link>
                    </Button>
                    {pendingSubmissions.length > 0 && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-amber-50 hover:bg-amber-100" 
                        onClick={() => setActiveTab("activities")}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Pending Reviews ({pendingSubmissions.length})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* All Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            {loading ? (
              <div className="grid gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <Card className="border-destructive">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => void load()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : rows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" aria-hidden="true" />
                  <p className="text-muted-foreground mb-4">No courses enrolled yet.</p>
                  <Button asChild>
                    <Link href="/free-courses">Browse Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <CourseSearchFilter
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  filterBy={filterBy}
                  onFilterChange={setFilterBy}
                  resultCount={filteredAndSortedCourses.length}
                />
                <div className="grid gap-6" role="list" aria-label="Course list">
                  {paginatedCourses.map((r) => {
                  const course = r?.enrollment?.courses;
                  const slug = course?.slug;
                  const g = r.grades;

                  const cat = typeof g?.cat_scaled_30 === "number" ? g.cat_scaled_30 : 0;
                  const exam = typeof g?.exam_scaled_70 === "number" ? g.exam_scaled_70 : 0;
                  const total = typeof g?.final_score_100 === "number" ? g.final_score_100 : 0;

                  return (
                    <Card 
                      key={r.enrollment?.id || slug}
                      role="listitem"
                      className={cn(
                        "transition-all duration-200 hover:shadow-lg",
                        r.passed 
                          ? "border-green-200 bg-gradient-to-br from-green-50/50 to-transparent" 
                          : r.enrollment?.is_completed 
                          ? "border-red-200 bg-gradient-to-br from-red-50/50 to-transparent" 
                          : "border-border"
                      )}
                    >
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              {course?.thumbnail_url && (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image
                                    src={course.thumbnail_url}
                                    alt={course.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                                  {course?.title || "Course"}
                                  {r.passed && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />}
                                </CardTitle>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {course?.category && (
                                    <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                                  )}
                                  {course?.difficulty_level && (
                                    <Badge variant="secondary" className="text-xs">{course.difficulty_level}</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-semibold">{r.progress}%</span>
                              </div>
                              <Progress value={r.progress} className="h-2" />
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {r.passed ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Passed
                              </Badge>
                            ) : r.enrollment?.is_completed ? (
                              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            ) : r.eligibleToComplete ? (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
                                <Clock className="h-3 w-3 mr-1" />
                                Not Passed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <BookOpen className="h-3 w-3 mr-1" />
                                In Progress
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Grades Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                          <div className={cn(
                            "rounded-lg border p-3 sm:p-4 overflow-x-hidden",
                            cat >= 21 ? "bg-green-50 border-green-200" : cat >= 15 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"
                          )}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground">CATs</span>
                              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                            </div>
                            <div className={cn(
                              "text-xl sm:text-2xl font-bold break-words",
                              cat >= 21 ? "text-green-700" : cat >= 15 ? "text-amber-700" : "text-gray-700"
                            )}>
                              {cat.toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">/ 30</div>
                          </div>
                          <div className={cn(
                            "rounded-lg border p-3 sm:p-4 overflow-x-hidden",
                            exam >= 49 ? "bg-green-50 border-green-200" : exam >= 35 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"
                          )}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground">Final Exam</span>
                              <Award className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                            </div>
                            <div className={cn(
                              "text-xl sm:text-2xl font-bold break-words",
                              exam >= 49 ? "text-green-700" : exam >= 35 ? "text-amber-700" : "text-gray-700"
                            )}>
                              {exam.toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">/ 70</div>
                          </div>
                          <div className={cn(
                            "rounded-lg border p-3 sm:p-4 overflow-x-hidden",
                            total >= 70 ? "bg-green-50 border-green-200" : total >= 50 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"
                          )}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground">Total Score</span>
                              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                            </div>
                            <div className={cn(
                              "text-xl sm:text-2xl font-bold break-words",
                              total >= 70 ? "text-green-700" : total >= 50 ? "text-amber-700" : "text-gray-700"
                            )}>
                              {total.toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">/ 100</div>
                          </div>
                        </div>

                        {/* Status Info */}
                        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                          {!g.has_final_exam ? (
                            <span className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                              No final exam configured yet.
                            </span>
                          ) : g.final_exam_pending_review ? (
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-500" />
                              Final exam submitted: pending review.
                            </span>
                          ) : g.final_exam_graded ? (
                            <span className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Final exam graded.
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-gray-500" />
                              Final exam not submitted yet.
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
                          {slug && !r.enrollment?.is_completed && (
                            <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm h-9">
                              <Link href={`/courses/${slug}/learn`}>
                                <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Continue Learning
                              </Link>
                            </Button>
                          )}
                          {slug && r.enrollment?.is_completed && !r.passed && (
                            <Button size="sm" asChild className="bg-amber-600 hover:bg-amber-700 text-xs sm:text-sm h-9">
                              <Link href={`/courses/${slug}/retake-final-exam`}>
                                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Retake Final Exam
                              </Link>
                            </Button>
                          )}
                          {slug && r.passed && (
                            <>
                              <Button size="sm" asChild className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-9">
                                <Link href={`/courses/${slug}/certificate`}>
                                  <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  View Certificate
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm h-9">
                                <Link href="/free-courses">
                                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Find Free Courses
                                </Link>
                              </Button>
                            </>
                          )}
                          {slug && r.enrollment?.is_completed && !r.passed && (
                            <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm h-9">
                              <Link href="/free-courses">
                                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Find Free Courses
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4" role="navigation" aria-label="Course pagination">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * COURSES_PER_PAGE) + 1} to {Math.min(currentPage * COURSES_PER_PAGE, filteredAndSortedCourses.length)} of {filteredAndSortedCourses.length} courses
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              aria-label={`Go to page ${pageNum}`}
                              aria-current={currentPage === pageNum ? "page" : undefined}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-4 sm:space-y-6">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Pending Submissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Pending Reviews ({pendingSubmissions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingSubmissions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No pending reviews. Great work!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingSubmissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="p-3 sm:p-4 rounded-lg border bg-card hover:shadow-md transition-all overflow-x-hidden"
                        >
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0 overflow-x-hidden">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge 
                                  variant={submission.type === "quiz" ? "default" : "secondary"}
                                  className="text-xs shrink-0"
                                >
                                  {submission.type === "quiz" ? "Quiz" : "Project"}
                                </Badge>
                                <span className="text-sm font-semibold break-words">{submission.lesson_title}</span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{submission.course_title}</p>
                              <p className="text-xs text-muted-foreground mt-2 break-words">
                                Submitted on {new Date(submission.submitted_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" asChild className="w-full sm:w-auto shrink-0 text-xs sm:text-sm h-9">
                              <Link href={`/courses/${submission.course_slug}/learn`}>
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity / Completed */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Completed Courses ({stats.passed})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rows.filter((r) => r.passed).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Complete courses to see certificates here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rows
                        .filter((r) => r.passed)
                        .map((r) => {
                          const course = r?.enrollment?.courses;
                          const slug = course?.slug;
                          return (
                            <div
                              key={r.enrollment?.id || slug}
                              className="p-3 sm:p-4 rounded-lg border bg-green-50/50 border-green-200 hover:shadow-md transition-all overflow-x-hidden"
                            >
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0 overflow-x-hidden">
                                  <h4 className="font-semibold text-sm sm:text-base break-words">{course?.title || "Course"}</h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                      <Trophy className="h-3 w-3 mr-1" />
                                      Passed
                                    </Badge>
                                    <span className="text-xs text-muted-foreground break-words">
                                      Score: {r.grades?.final_score_100?.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                                {slug && (
                                  <Button size="sm" variant="outline" asChild className="w-full sm:w-auto shrink-0 text-xs sm:text-sm h-9">
                                    <Link href={`/courses/${slug}/certificate`}>
                                      <Trophy className="h-3 w-3 mr-1" />
                                      Certificate
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </DashboardErrorBoundary>
  );
}
