"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/blog/Sidebar";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Filter, X } from "lucide-react";
import { CourseCard, type Course } from "@/components/courses/CourseCard";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

export default function FreeCoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const hasInitialized = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<string>("newest");
  const [selectedDuration, setSelectedDuration] = useState<string>("all");
  const [selectedMinRating, setSelectedMinRating] = useState<string>("all");
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>(() => {
    // Try to restore categories from sessionStorage
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("course-categories");
      if (cached) {
        try {
          const data = JSON.parse(cached);
          const cacheTime = data.timestamp || 0;
          const now = Date.now();
          if (now - cacheTime < 5 * 60 * 1000) {
            return data.categories || [];
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    return [];
  });
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(() => {
    // Try to restore total from sessionStorage
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("free-courses-cache");
      if (cached) {
        try {
          const data = JSON.parse(cached);
        const cacheTime = data.timestamp || 0;
        const now = Date.now();
        // Cache for 30 seconds only
        if (now - cacheTime < 30 * 1000) {
          return data.total || 0;
        }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    return 0;
  });
  const [offset, setOffset] = useState(0);
  const limit = 12;

  useEffect(() => {
    // Initialize filters from URL (deep link support)
    const urlSearch = searchParams.get("search") || "";
    const urlCategory = searchParams.get("category") || "all";
    const urlDifficulty = searchParams.get("difficulty") || "all";
    const urlSort = searchParams.get("sort") || "newest";
    const urlMinDuration = searchParams.get("min_duration");
    const urlMaxDuration = searchParams.get("max_duration");
    const urlMinRating = searchParams.get("min_rating");

    const urlDuration = urlMinDuration || urlMaxDuration
      ? `${urlMinDuration || "0"}-${urlMaxDuration || ""}`
      : "all";
    const urlRating = urlMinRating ? urlMinRating : "all";

    // Check if we have cached data for these exact filters
    const cacheKey = `free-courses-${urlSearch}-${urlCategory}-${urlDifficulty}-${urlSort}-${urlDuration}-${urlRating}`;
    const cached = typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null;
    let hasValidCache = false;

    if (cached) {
      try {
        const data = JSON.parse(cached);
        const cacheTime = data.timestamp || 0;
        const now = Date.now();
        // Use cached data if less than 30 seconds old (for fresh enrollment counts)
        if (now - cacheTime < 30 * 1000 && data.courses && data.courses.length > 0) {
          // Restore from cache immediately
          setCourses(data.courses);
          setTotal(data.total || 0);
          setLoading(false);
          setInitialLoad(false);
          hasValidCache = true;
          hasInitialized.current = true;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    setSearchQuery(urlSearch);
    setSelectedCategory(urlCategory);
    setSelectedDifficulty(urlDifficulty);
    setSelectedSort(urlSort);
    setSelectedDuration(urlDuration);
    setSelectedMinRating(urlRating);
    setOffset(0);

    // Only fetch if we don't have valid cached data
    if (!hasValidCache) {
      // Fetch categories and courses in parallel
      Promise.all([
        fetchCategories(),
        fetchCourses({ replace: true, nextOffset: 0, override: { search: urlSearch, category: urlCategory, difficulty: urlDifficulty, sort: urlSort, duration: urlDuration, minRating: urlRating } })
      ]).then(() => {
        setInitialLoad(false);
        hasInitialized.current = true;
      });
    }

    if (user) {
      fetchEnrollments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    // Debounce search/filters
    const timer = setTimeout(() => {
      setOffset(0);
      syncUrl();
      fetchCourses({ replace: true, nextOffset: 0 });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedSort, selectedDuration, selectedMinRating]);

  const syncUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedDifficulty !== "all") params.set("difficulty", selectedDifficulty);
    if (selectedSort !== "newest") params.set("sort", selectedSort);

    if (selectedDuration !== "all") {
      const [minStr, maxStr] = selectedDuration.split("-");
      const min = parseInt(minStr || "0");
      const max = maxStr ? parseInt(maxStr) : NaN;
      if (!Number.isNaN(min) && min > 0) params.set("min_duration", String(min));
      if (!Number.isNaN(max)) params.set("max_duration", String(max));
    }

    if (selectedMinRating !== "all") {
      params.set("min_rating", selectedMinRating);
    }

    const qs = params.toString();
    router.replace(qs ? `/free-courses?${qs}` : "/free-courses");
  };

  const fetchCategories = async () => {
    try {
      // Use cache to prevent refetching on every render
      const cacheKey = "course-categories";
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        const cacheTime = data.timestamp || 0;
        const now = Date.now();
        // Cache for 2 minutes (categories don't change often)
        if (now - cacheTime < 2 * 60 * 1000) {
          setCategories(data.categories || []);
          return;
        }
      }

      const response = await fetch("/api/courses/meta", {
        cache: 'default'
      });
      const data = await response.json();
      const categories = data.categories || [];
      setCategories(categories);
      
      // Cache the result
      sessionStorage.setItem(cacheKey, JSON.stringify({
        categories,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error fetching course categories:", error);
    }
  };

  const fetchCourses = async (opts?: {
    replace?: boolean;
    nextOffset?: number;
    override?: { search?: string; category?: string; difficulty?: string; sort?: string; duration?: string; minRating?: string };
  }) => {
    const replace = opts?.replace ?? true;
    const nextOffset = opts?.nextOffset ?? offset;
    const override = opts?.override;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      const effectiveSearch = override?.search ?? searchQuery;
      const effectiveCategory = override?.category ?? selectedCategory;
      const effectiveDifficulty = override?.difficulty ?? selectedDifficulty;
      const effectiveSort = override?.sort ?? selectedSort;
      const effectiveDuration = override?.duration ?? selectedDuration;
      const effectiveMinRating = override?.minRating ?? selectedMinRating;

      if (effectiveSearch) params.append("search", effectiveSearch);
      if (effectiveCategory !== "all") params.append("category", effectiveCategory);
      if (effectiveDifficulty !== "all") params.append("difficulty", effectiveDifficulty);
      if (effectiveSort) params.append("sort", effectiveSort);

      if (effectiveDuration !== "all") {
        const [minStr, maxStr] = effectiveDuration.split("-");
        const min = parseInt(minStr || "0");
        const max = maxStr ? parseInt(maxStr) : NaN;
        if (!Number.isNaN(min) && min > 0) params.append("min_duration", String(min));
        if (!Number.isNaN(max)) params.append("max_duration", String(max));
      }

      if (effectiveMinRating !== "all") {
        params.append("min_rating", effectiveMinRating);
      }

      params.append("limit", String(limit));
      params.append("offset", String(nextOffset));

      const response = await fetch(`/api/courses?${params.toString()}`, {
        // Use no-store to get fresh data
        cache: 'no-store',
        next: { revalidate: 10 }
      });
      const data = await response.json();
      setTotal(data.total || 0);
      setOffset(nextOffset);

      const nextCourses = (data.courses || []) as Course[];
      const finalCourses = replace ? nextCourses : [...courses, ...nextCourses];
      setCourses(finalCourses);
      
      // Cache the courses data in sessionStorage with filter-specific key
      if (replace && typeof window !== "undefined") {
        const effectiveSearch = override?.search ?? searchQuery;
        const effectiveCategory = override?.category ?? selectedCategory;
        const effectiveDifficulty = override?.difficulty ?? selectedDifficulty;
        const effectiveSort = override?.sort ?? selectedSort;
        const effectiveDuration = override?.duration ?? selectedDuration;
        const effectiveMinRating = override?.minRating ?? selectedMinRating;
        
        const cacheKey = `free-courses-${effectiveSearch}-${effectiveCategory}-${effectiveDifficulty}-${effectiveSort}-${effectiveDuration}-${effectiveMinRating}`;
        // Cache for only 30 seconds to ensure fresh enrollment counts
        sessionStorage.setItem(cacheKey, JSON.stringify({
          courses: finalCourses,
          total: data.total || 0,
          timestamp: Date.now()
        }));
        
        // Also update the default cache (30 seconds)
        sessionStorage.setItem("free-courses-cache", JSON.stringify({
          courses: finalCourses,
          total: data.total || 0,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data: enrollments } = await supabase
        .from("user_course_enrollments")
        .select("course_id, is_completed")
        .eq("user_id", user.id);

      if (enrollments) {
        setEnrolledCourseIds(new Set(enrollments.map((e: { course_id: string }) => e.course_id)));

        // Fetch progress for each enrolled course
        const progressMap: Record<string, number> = {};
        for (const enrollment of enrollments) {
          const { count: totalLessons } = await supabase
            .from("lessons")
            .select("*", { count: "exact", head: true })
            .eq("course_id", enrollment.course_id)
            .eq("is_published", true);

          const { count: completedLessons } = await supabase
            .from("user_lesson_completion")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("course_id", enrollment.course_id);

          const { count: pendingQuizCount } = await supabase
            .from("lesson_quiz_submissions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("course_id", enrollment.course_id)
            .eq("status", "pending_review");

          const pendingProjectsRes = await supabase
            .from("lesson_project_submissions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("course_id", enrollment.course_id)
            .eq("status", "pending_review");
          const pendingProjectCount = pendingProjectsRes.error ? 0 : (pendingProjectsRes.count || 0);

          const numerator = Math.min(
            totalLessons || 0,
            (completedLessons || 0) + (pendingQuizCount || 0) + (pendingProjectCount || 0)
          );

          if (totalLessons && totalLessons > 0) {
            progressMap[enrollment.course_id] = Math.round(
              (numerator / totalLessons) * 100
            );
          }
        }
        setCourseProgress(progressMap);
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedDifficulty("all");
    setSelectedSort("newest");
    setSelectedDuration("all");
    setSelectedMinRating("all");
    setOffset(0);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== "all" ||
    selectedDifficulty !== "all" ||
    selectedDuration !== "all" ||
    selectedMinRating !== "all";
  const canLoadMore = courses.length < total;

  return (
    <>
      <div className="bg-muted/30 py-8 sm:py-10 md:py-12 border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Free Courses</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            Step-by-step guides and free courses to help you learn new technologies, frameworks, and best practices. 
            From beginner-friendly introductions to advanced techniques.
          </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
        <Card className="mb-6 sm:mb-8 border-amber-500/30 dark:border-amber-400/40 bg-gradient-to-br from-amber-50/80 via-amber-50/40 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 dark:to-transparent shadow-sm">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/50 p-1.5 sm:p-2">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 space-y-2 sm:space-y-3">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-base sm:text-lg">Free Courses Disclaimer</h3>
                <div className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-200/90 space-y-1.5 sm:space-y-2 leading-relaxed">
                  <p>
                    All free courses on CodeCraft Academy may include embedded educational resources from third-party
                    platforms, such as YouTube.
                  </p>
                  <p>These materials are used strictly for learning and reference purposes.</p>
                  <p>
                    CodeCraft Academy does not own any third-party video content and does not claim authorship of such
                    materials.
                  </p>
                  <p>
                    All rights remain with the original creators, and proper attribution is provided where applicable.
                  </p>
                  <p>
                    If you are a content owner and believe any material has been used inappropriately, please{" "}
                    <a 
                      href="/contact" 
                      className="text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 underline font-medium transition-colors"
                    >
                      contact us
                    </a>
                    {" "}for prompt review or removal.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              className="pl-10 h-10 sm:h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-11">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-11">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-11">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="highest_rated">Highest Rated</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDuration} onValueChange={setSelectedDuration}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-11">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Duration</SelectItem>
              <SelectItem value="0-60">Under 1 hour</SelectItem>
              <SelectItem value="60-180">1–3 hours</SelectItem>
              <SelectItem value="180-">3+ hours</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMinRating} onValueChange={setSelectedMinRating}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-11">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Rating</SelectItem>
              <SelectItem value="4.5">4.5+ stars</SelectItem>
              <SelectItem value="4">4.0+ stars</SelectItem>
              <SelectItem value="3.5">3.5+ stars</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="gap-2 w-full sm:w-auto h-10 sm:h-11">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10">
          <div className="lg:col-span-8">
            {loading && initialLoad ? (
              <div className="text-center py-12 sm:py-16">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                <p className="text-sm sm:text-base text-muted-foreground">Loading courses...</p>
              </div>
            ) : courses.length > 0 ? (
              <>
                <div className="mb-4 sm:mb-5 text-xs sm:text-sm text-muted-foreground">
                  Showing {courses.length} of {total} course{total !== 1 ? "s" : ""}
                </div>
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      enrolled={enrolledCourseIds.has(course.id)}
                      progress={courseProgress[course.id] || 0}
                    />
                  ))}
                </div>

                {canLoadMore && (
                  <div className="mt-8 sm:mt-10 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => fetchCourses({ replace: false, nextOffset: courses.length })}
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      {loading ? "Loading..." : "Load more"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 sm:py-16 text-muted-foreground">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-base sm:text-lg font-medium mb-2">No courses found</p>
                <p className="text-xs sm:text-sm mb-4">
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : "Check back soon for new free courses!"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>

          <aside className="lg:col-span-4">
            <Sidebar />
          </aside>
        </div>
      </div>
    </>
  );
}
