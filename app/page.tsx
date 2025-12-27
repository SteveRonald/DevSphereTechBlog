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
      <section className="relative overflow-hidden bg-background pt-16 md:pt-20 pb-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="container max-w-5xl mx-auto relative z-10 px-4 md:px-6 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
              <Rocket className="mr-2 h-4 w-4" />
              <span>start your tech journey right now</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-4xl md:text-6xl">
              Learn Modern Tech Skills with<br className="hidden sm:inline" />
              <span className="text-gradient">CodeCraft Academy</span>
            </h1>
            <br />
            <hr className="my-4 border-primary/20" />
            <p className="mx-auto max-w-[600px] text-base text-muted-foreground md:text-lg">
              Free short courses and guided learning paths to help beginners build real tech skills — fast, practical, and beginner-friendly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link href="/free-courses">
                  Start Free Courses <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="/free-courses?difficulty=beginner">
                  View Beginner Roadmap
                </Link>
              </Button>
            </div>
            <br className="hidden sm:block" />
            <p className="text-sm text-muted-foreground pt-1">
              Start your journey in Internet, Python Programming, Web Development, or AI — no prior experience required.
            </p>
          </div>
        </div>
      </section>

      {/* Value Bar */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="font-semibold">Beginner-friendly</p>
            <p className="text-xs text-muted-foreground mt-1">Clear steps from zero</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="font-semibold">Short & practical</p>
            <p className="text-xs text-muted-foreground mt-1">Learn in minutes</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="font-semibold">Project-based</p>
            <p className="text-xs text-muted-foreground mt-1">Build real skills</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="font-semibold">Free to start</p>
            <p className="text-xs text-muted-foreground mt-1">No paywalls</p>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 pb-10 md:pb-14">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Start Learning With These Free Courses</h2>
            <p className="text-muted-foreground">Choose a short, structured course and build skills step-by-step.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/free-courses">Browse All Courses</Link>
          </Button>
        </div>

        {featuredCourses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {featuredCourses.map((course: any) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <p>No courses published yet. Add your first course in the admin dashboard.</p>
          </div>
        )}
      </section>

      {/* Course Categories */}
      <section id="course-categories" className="container max-w-7xl mx-auto px-4 md:px-6 pb-12 md:pb-20">
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">Explore by Category</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pick a track and start learning in minutes.
          </p>
        </div>

        {featuredCourses.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {(() => {
              const categories = featuredCourses
                .map((c: any) => (typeof c?.category === "string" ? c.category.trim() : ""))
                .filter((c: string) => c.length > 0);
              const uniqueCategories = Array.from(new Set<string>(categories));

              return uniqueCategories.map((category) => (
              <Button key={category} variant="outline" asChild className="hover:scale-105 transition-transform duration-200 text-color-primary hover:text-primary-foreground hover:bg-primary">
                <Link href={`/free-courses?category=${encodeURIComponent(category)}`}>{category}</Link>
              </Button>
              ));
            })()}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/free-courses">Browse Courses</Link>
            </Button>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 pb-12 md:pb-20">
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">How Learning Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A simple flow that keeps you moving and building confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm font-semibold text-primary mb-2">Step 1</p>
            <h3 className="text-lg font-semibold mb-2">Pick a Course</h3>
            <p className="text-muted-foreground">Choose a beginner-friendly course and enroll for free.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm font-semibold text-primary mb-2">Step 2</p>
            <h3 className="text-lg font-semibold mb-2">Learn by Doing</h3>
            <p className="text-muted-foreground">Short lessons, videos, quizzes, and mini projects that unlock step-by-step.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm font-semibold text-primary mb-2">Step 3</p>
            <h3 className="text-lg font-semibold mb-2">Build Skills & Momentum</h3>
            <p className="text-muted-foreground">Track progress and keep improving with new courses and tutorials.</p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button size="lg" asChild>
            <Link href="/free-courses">Start Learning Now</Link>
          </Button>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 pb-12 md:pb-20">
        
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-8 md:mb-12">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Featured Article</h2>
            </div>
            <PostCard post={featuredPost} featured={true} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Main Feed */}
          <div className="lg:col-span-8" id="blog-categories">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">From the Knowledge Base</h2>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" asChild>
                <Link href="/blog">View all</Link>
              </Button>
            </div>
            
            {latestPosts.length > 0 ? (
              <Suspense fallback={<PageLoading />}>
                <FilteredPosts posts={latestPosts} categories={categories} />
              </Suspense>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No posts yet. Check back soon!</p>
              </div>
            )}

            <div className="mt-8 md:mt-10 flex justify-center">
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
      <section className="container max-w-7xl mx-auto px-4 md:px-6 pb-12 md:pb-20">
        <div className="rounded-2xl border border-border bg-muted/30 p-8 md:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">Start Learning Today — It’s Free</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            No long courses. No fluff. Just practical, hands-on tech learning made simple for beginners.
          </p>
          <div className="mt-6 flex justify-center">
            <Button size="lg" asChild>
              <Link href="/free-courses">Start Free Courses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About CodeCraft Academy Section - For Google OAuth Verification */}
      <section className="relative overflow-hidden bg-muted/30 py-16 md:py-20">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-50" />
        </div>
        <div className="container max-w-5xl mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm mb-4">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              <span>About Us</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              About <span className="text-gradient">CodeCraft Academy</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-left">
              <p className="text-lg text-muted-foreground leading-relaxed">
                <strong className="text-foreground">CodeCraft Academy</strong> is a beginner-focused tech learning platform built around free short courses, guided learning paths, and practical tutorials.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Learn step-by-step with structured lessons, quizzes, and real examples — plus a knowledge base of tutorials, reviews, and snippets that support what you’re learning.
              </p>
            </div>
            <div className="space-y-4 text-left">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our mission is to make quality tech education accessible and practical — especially for beginners who want a clear path from zero to real skills.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Web Development</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Free Courses</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Career Advice</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">AI & ML</span>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
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

