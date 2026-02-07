"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { CourseCard, type Course } from "@/components/courses/CourseCard";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
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
  const searchParamsString = searchParams.toString();

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
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>(() => {
    // Try to restore categories from sessionStorage
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("course-categories");
      if (cached) {
        try {
          const data = JSON.parse(cached);
          const cacheTime = data.timestamp || 0;
          const now = Date.now();
          // Cache for 2 minutes (categories don't change often)
          if (now - cacheTime < 2 * 60 * 1000) {
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
  const lastInitParamsString = useRef<string | null>(null);

  useEffect(() => {
    // Avoid re-running initialization if query string didn't actually change.
    // (useSearchParams can produce a new object identity on rerenders)
    if (lastInitParamsString.current === searchParamsString) return;
    lastInitParamsString.current = searchParamsString;

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
        fetchCourses({ replace: true, nextOffset: 0, showLoading: true, override: { search: urlSearch, category: urlCategory, difficulty: urlDifficulty, sort: urlSort, duration: urlDuration, minRating: urlRating } })
      ]).then(() => {
        setInitialLoad(false);
        hasInitialized.current = true;
      });
    }

    if (user) {
      fetchEnrollments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsString, user]);

  useEffect(() => {
    // Skip if initial load hasn't completed yet
    if (!hasInitialized.current) return;
    
    // Debounce search/filters - don't show loading spinner to prevent blinking
    const timer = setTimeout(() => {
      setOffset(0);
      syncUrl();
      fetchCourses({ replace: true, nextOffset: 0, showLoading: false });
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
    const nextUrl = qs ? `/free-courses?${qs}` : "/free-courses";
    if (typeof window !== "undefined") {
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (currentUrl === nextUrl) return;
    }
    router.replace(nextUrl, { scroll: false });
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
    showLoading?: boolean;
    override?: { search?: string; category?: string; difficulty?: string; sort?: string; duration?: string; minRating?: string };
  }) => {
    const replace = opts?.replace ?? true;
    const nextOffset = opts?.nextOffset ?? offset;
    const override = opts?.override;
    const showLoading = opts?.showLoading ?? false;

    // Only show loading spinner on initial load or explicit request
    // This prevents blinking during search/filter changes
    if (showLoading || initialLoad) {
      setLoading(true);
    }
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
        // Use no-store to get fresh enrollment counts
        cache: 'no-store',
        next: { revalidate: 5 }
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
      <div className="bg-gradient-to-br from-primary/20 via-background to-background py-10 sm:py-14 md:py-16 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-google-sans">Courses</h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl leading-relaxed font-google-sans">
            Step-by-step guides and free courses to help you learn new technologies, frameworks, and best practices. 
            From beginner-friendly introductions to advanced techniques.
          </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
        <Card className="mb-8 sm:mb-10 border-amber-500/30 dark:border-amber-400/40 bg-gradient-to-br from-amber-50/80 via-amber-50/40 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 dark:to-transparent shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsDisclaimerOpen(!isDisclaimerOpen);
              }}
              type="button"
              className="w-full flex items-center justify-between gap-4 text-left hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/50 p-2 sm:p-3">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-base sm:text-lg font-google-sans">Free Courses Disclaimer</h3>
              </div>
              {isDisclaimerOpen ? (
                <ChevronUp className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              )}
            </button>
            {isDisclaimerOpen && (
              <div className="mt-4 pl-11 sm:pl-14 text-sm text-amber-800/90 dark:text-amber-200/90 space-y-2 leading-relaxed font-google-sans">
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
            )}
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              className="pl-12 h-12 sm:h-14 text-base font-google-sans border-2 border-border/50 hover:border-primary/30 focus:border-primary transition-colors duration-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px] h-12 sm:h-14 text-base font-google-sans border-2 border-border/50 hover:border-primary/30 focus:border-primary transition-colors duration-300">
              <Filter className="h-5 w-5 mr-3" />
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
            <SelectTrigger className="w-full sm:w-[200px] h-12 sm:h-14 text-base font-google-sans border-2 border-border/50 hover:border-primary/30 focus:border-primary transition-colors duration-300">
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
            <SelectTrigger className="w-full sm:w-[200px] h-12 sm:h-14 text-base font-google-sans border-2 border-border/50 hover:border-primary/30 focus:border-primary transition-colors duration-300">
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
            <SelectTrigger className="w-full sm:w-[200px] h-12 sm:h-14 text-base font-google-sans border-2 border-border/50 hover:border-primary/30 focus:border-primary transition-colors duration-300">
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
            <SelectTrigger className="w-full sm:w-[200px] h-12 sm:h-14 text-base font-google-sans border-2 border-border/50 hover:border-primary/30 focus:border-primary transition-colors duration-300">
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
            <Button variant="outline" onClick={clearFilters} className="gap-3 w-full sm:w-auto h-12 sm:h-14 text-base font-google-sans font-medium border-2 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
              <X className="h-5 w-5" />
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
                <div className="mb-6 text-sm text-muted-foreground font-google-sans">
                  Showing {courses.length} of {total} course{total !== 1 ? "s" : ""}
                </div>
                <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
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
              <div className="text-center py-16 sm:py-20 text-muted-foreground">
                <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-6 opacity-50" />
                <p className="text-lg sm:text-xl font-medium mb-3 font-google-sans">No courses found</p>
                <p className="text-sm sm:text-base mb-6 font-google-sans">
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : "Check back soon for new free courses!"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto h-12 text-base font-google-sans font-medium border-2 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>

          <aside className="lg:col-span-4">
            <div className="space-y-6">
              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-google-sans">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start h-10 text-sm font-google-sans" asChild>
                    <Link href="/free-courses">Courses</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-10 text-sm font-google-sans" asChild>
                    <Link href="/reviews">Reviews</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-10 text-sm font-google-sans" asChild>
                    <Link href="/career">Career</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
