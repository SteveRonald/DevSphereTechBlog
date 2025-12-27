import { Layout } from "@/components/layout/Layout";
import { PostCard } from "@/components/blog/PostCard";
import { Sidebar } from "@/components/blog/Sidebar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Sparkles } from "lucide-react";
import { sanityClient } from "@/lib/sanity";
import { featuredPostsQuery, recentPostsQuery, categoriesQuery } from "@/lib/sanity.queries";
import type { Post } from "@/components/blog/PostCard";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/loading";
import Link from "next/link";
import { FilteredPosts } from "@/components/home/FilteredPosts";
import { Testimonials } from "@/components/home/Testimonials";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { createServerClient } from "@/lib/supabase-server";
import { CourseCard } from "@/components/courses/CourseCard";

async function getFeaturedPosts(): Promise<Post[]> {
  try {
    const posts = await sanityClient.fetch<Post[]>(featuredPostsQuery);
    return posts || [];
  } catch (error) {
    console.error("Error fetching featured posts:", error);
    return [];
  }
}

async function getRecentPosts(): Promise<Post[]> {
  try {
    const posts = await sanityClient.fetch<Post[]>(recentPostsQuery);
    return posts || [];
  } catch (error) {
    console.error("Error fetching recent posts:", error);
    return [];
  }
}

async function getCategories() {
  try {
    const categories = await sanityClient.fetch(categoriesQuery);
    return categories || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

async function getFeaturedCourses() {
  try {
    const supabase = createServerClient(undefined);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("enrollment_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Error fetching featured courses:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching featured courses:", error);
    return [];
  }
}

// Revalidate every 60 seconds to show fresh content from Sanity
export const revalidate = 60;

export default async function Home() {
  const [featuredPosts, recentPosts, categories, featuredCourses] = await Promise.all([
    getFeaturedPosts(),
    getRecentPosts(),
    getCategories(),
    getFeaturedCourses(),
  ]);

  const featuredPost = featuredPosts[0];
  const latestPosts = recentPosts.slice(0, 6);

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-20 sm:pt-24 md:pt-32 pb-16 sm:pb-20 md:pb-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-[-10%] right-[-5%] w-64 h-64 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
           <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 sm:w-[500px] sm:h-[500px] bg-secondary/20 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="container max-w-5xl mx-auto relative z-10 px-4 sm:px-6 text-center">
          <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary backdrop-blur-sm">
              <Rocket className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span>start your tech journey right now</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Learn Modern Tech Skills with<br className="hidden sm:inline" />
              <span className="text-gradient">CodeCraft Academy</span>
            </h1>
            <p className="mx-auto max-w-[600px] text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed px-2">
              Free short courses and guided learning paths to help beginners build real tech skills — fast, practical, and beginner-friendly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Button size="lg" className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base w-full sm:w-auto" asChild>
                <Link href="/free-courses">
                  Start Free Courses <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base w-full sm:w-auto" asChild>
                <Link href="/free-courses?difficulty=beginner">
                  View Beginner Roadmap
                </Link>
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground pt-2 sm:pt-4 px-4">
              Start your journey in Internet, Python Programming, Web Development, or AI — no prior experience required.
            </p>
          </div>
        </div>
      </section>

      {/* Value Bar */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5 text-center">
            <p className="text-sm sm:text-base font-semibold">Beginner-friendly</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">Clear steps from zero</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5 text-center">
            <p className="text-sm sm:text-base font-semibold">Short & practical</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">Learn in minutes</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5 text-center">
            <p className="text-sm sm:text-base font-semibold">Project-based</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">Build real skills</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5 text-center">
            <p className="text-sm sm:text-base font-semibold">Free to start</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">No paywalls</p>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-10">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Start Learning With These Free Courses</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Choose a short, structured course and build skills step-by-step.</p>
          </div>
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/free-courses">Browse All Courses</Link>
          </Button>
        </div>

        {featuredCourses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {featuredCourses.map((course: any) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 text-muted-foreground">
            <p className="text-sm sm:text-base">No courses published yet. Add your first course in the admin dashboard.</p>
          </div>
        )}
      </section>

      {/* Course Categories */}
      <section id="course-categories" className="container max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3 sm:mb-4">Explore by Category</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            Pick a track and start learning in minutes.
          </p>
        </div>

        {featuredCourses.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-4">
            {(() => {
              const categories = featuredCourses
                .map((c: any) => (typeof c?.category === "string" ? c.category.trim() : ""))
                .filter((c: string) => c.length > 0);
              const uniqueCategories = Array.from(new Set<string>(categories));

              return uniqueCategories.map((category) => (
              <Button key={category} variant="outline" size="sm" asChild className="hover:scale-105 transition-transform duration-200 text-xs sm:text-sm">
                <Link href={`/free-courses?category=${encodeURIComponent(category)}`}>{category}</Link>
              </Button>
              ));
            })()}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/free-courses">Browse Courses</Link>
            </Button>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3 sm:mb-4">How Learning Works</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            A simple flow that keeps you moving and building confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-5xl mx-auto">
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <p className="text-xs sm:text-sm font-semibold text-primary mb-2 sm:mb-3">Step 1</p>
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Pick a Course</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Choose a beginner-friendly course and enroll for free.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <p className="text-xs sm:text-sm font-semibold text-primary mb-2 sm:mb-3">Step 2</p>
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Learn by Doing</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Short lessons, videos, quizzes, and mini projects that unlock step-by-step.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <p className="text-xs sm:text-sm font-semibold text-primary mb-2 sm:mb-3">Step 3</p>
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Build Skills & Momentum</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Track progress and keep improving with new courses and tutorials.</p>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 flex justify-center">
          <Button size="lg" className="w-full sm:w-auto" asChild>
            <Link href="/free-courses">Start Learning Now</Link>
          </Button>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
        
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-8 sm:mb-10 md:mb-12">
            <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Featured Article</h2>
            </div>
            <PostCard post={featuredPost} featured={true} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10">
          {/* Main Feed */}
          <div className="lg:col-span-8" id="blog-categories">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">From the Knowledge Base</h2>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 w-full sm:w-auto" asChild>
                <Link href="/blog">View all</Link>
              </Button>
            </div>
            
            {latestPosts.length > 0 ? (
              <Suspense fallback={<PageLoading />}>
                <FilteredPosts posts={latestPosts} categories={categories} />
              </Suspense>
            ) : (
              <div className="text-center py-12 sm:py-16 text-muted-foreground">
                <p className="text-sm sm:text-base">No posts yet. Check back soon!</p>
              </div>
            )}

            <div className="mt-8 sm:mt-10 flex justify-center">
              <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/blog">View All Posts</Link>
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <Sidebar />
          </aside>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
        <div className="rounded-2xl border border-border bg-muted/30 p-6 sm:p-8 md:p-10 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3 sm:mb-4">Start Learning Today — It's Free</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
            No long courses. No fluff. Just practical, hands-on tech learning made simple for beginners.
          </p>
          <div className="mt-6 sm:mt-8 flex justify-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/free-courses">Start Free Courses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About CodeCraft Academy Section - For Google OAuth Verification */}
      <section className="relative overflow-hidden bg-muted/30 py-12 sm:py-16 md:py-20">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-secondary/10 rounded-full blur-3xl opacity-50" />
        </div>
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs sm:text-sm font-medium text-primary backdrop-blur-sm mb-3 sm:mb-4">
              <Sparkles className="mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>About Us</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 sm:mb-6">
              About <span className="text-gradient">CodeCraft Academy</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="space-y-4 text-left">
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                <strong className="text-foreground">CodeCraft Academy</strong> is a beginner-focused tech learning platform built around free short courses, guided learning paths, and practical tutorials.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                Learn step-by-step with structured lessons, quizzes, and real examples — plus a knowledge base of tutorials, reviews, and snippets that support what you're learning.
              </p>
            </div>
            <div className="space-y-4 text-left">
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                Our mission is to make quality tech education accessible and practical — especially for beginners who want a clear path from zero to real skills.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">Web Development</span>
                <span className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">Free Courses</span>
                <span className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">Career Advice</span>
                <span className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">AI & ML</span>
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> | <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <WhyChooseUs />

      {/* Testimonials Section */}
      <Testimonials />
    </>
  );
}

