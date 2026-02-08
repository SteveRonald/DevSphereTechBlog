import { PostCard } from "@/components/blog/PostCard";
import { SidebarMinimal } from "@/components/blog/SidebarMinimal";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Award, Rocket, TrendingUp, Target, Zap, Sparkles, GraduationCap } from "lucide-react";
import type { Post } from "@/components/blog/PostCard";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/loading";
import Link from "next/link";
import { FilteredPosts } from "@/components/home/FilteredPosts";
import { Testimonials } from "@/components/home/Testimonials";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { createServerClient } from "@/lib/supabase-server";
import { CourseGridWithEnrollment } from "@/components/courses/CourseGridWithEnrollment";
import { PageSearch } from "@/components/search/PageSearch";

async function getFeaturedPosts(): Promise<Post[]> {
  try {
    const supabase = await createServerClient(undefined);
    const { data: posts } = await supabase
      .from("blog_posts")
      .select(`
        id,
        title,
        slug,
        excerpt,
        main_image_url,
        published_at,
        read_time,
        featured,
        blog_categories (
          id,
          title,
          slug
        ),
        blog_authors (
          name,
          role
        )
      `)
      .eq("published", true)
      .eq("featured", true)
      .order("published_at", { ascending: false })
      .limit(3);

    return posts || [];
  } catch (error) {
    console.error("Error fetching featured posts:", error);
    return [];
  }
}

async function getRecentPosts(): Promise<Post[]> {
  try {
    const supabase = await createServerClient(undefined);
    const { data: posts } = await supabase
      .from("blog_posts")
      .select(`
        id,
        title,
        slug,
        excerpt,
        main_image_url,
        published_at,
        read_time,
        blog_categories (
          id,
          title,
          slug
        ),
        blog_authors (
          name,
          role
        )
      `)
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(6);

    return posts || [];
  } catch (error) {
    console.error("Error fetching recent posts:", error);
    return [];
  }
}

async function getCategories() {
  try {
    const supabase = await createServerClient(undefined);
    const { data: categories } = await supabase
      .from("blog_categories")
      .select("id, title, slug")
      .order("title", { ascending: true });

    return categories || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

async function getFeaturedCourses() {
  try {
    const supabase = await createServerClient(undefined);
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

    if (!data || data.length === 0) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error fetching featured courses:", error);
    return [];
  }
}

// Revalidate every 60 seconds to show fresh content from Supabase
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
      {/* Hero Section with Animation */}
      <div className="relative bg-gradient-to-br from-primary/20 via-background to-background py-16 sm:py-20 md:py-24 border-b border-border overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-60 animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-2xl opacity-40" />
          {/* Learning-themed background image */}
          <div 
            className="absolute inset-0 opacity-[0.3] bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80&auto=format&fit=crop')",
              filter: "brightness(0.9) contrast(1.1)"
            }}
          />
        </div>

        <div className="container max-w-6xl mx-auto relative z-10 px-4 sm:px-6">
          <div className="text-center space-y-8 sm:space-y-10">
            {/* Trust badge */}
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-primary shadow-lg">
              <Rocket className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-google-sans font-medium">Join 5,000+ learners</span>
            </div>
            
            {/* Main heading */}
            <div className="space-y-4 sm:space-y-6">
              <h1 className="font-extrabold tracking-tight leading-tight">
                <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-google-sans font-bold">
                  Learn Modern Tech Skills with
                </span>
                <span className="block mt-3 sm:mt-4 md:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-google-sans font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  CodeCraft Academy
                </span>
              </h1>
              <p className="mx-auto max-w-3xl text-base sm:text-lg md:text-xl text-foreground/80 leading-relaxed font-google-sans font-normal px-4">
                Short, practical lessons to help you build real skills. No hype. Just clear steps you can follow.
              </p>
            </div>
            
            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-4 sm:pt-6">
              <Button size="lg" className="h-12 sm:h-14 px-7 sm:px-9 text-base font-google-sans font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" asChild>
                <Link href="/free-courses">
                  Start Free Courses <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 sm:h-14 px-7 sm:px-9 text-base font-google-sans font-semibold border-2 hover:bg-accent/10 transition-all duration-300" asChild>
                <Link href="/free-courses?difficulty=beginner">
                  View Beginner Roadmap
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Value Bar */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 md:pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 sm:p-8 text-center hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:shadow-lg">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <p className="text-base sm:text-lg font-semibold font-google-sans">Beginner-friendly</p>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-google-sans">Clear steps from zero</p>
          </div>
          <div className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 sm:p-8 text-center hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:shadow-lg">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
            </div>
            <p className="text-base sm:text-lg font-semibold font-google-sans">Short & practical</p>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-google-sans">Learn in minutes</p>
          </div>
          <div className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 sm:p-8 text-center hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:shadow-lg">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
            </div>
            <p className="text-base sm:text-lg font-semibold font-google-sans">Project-based</p>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-google-sans">Build real skills</p>
          </div>
          <div className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 sm:p-8 text-center hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:shadow-lg">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <span className="text-green-600 font-bold text-base sm:text-lg font-google-sans">$0</span>
            </div>
            <p className="text-base sm:text-lg font-semibold font-google-sans">Free to start</p>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-google-sans">No paywalls</p>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 md:pb-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 md:mb-12">
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight font-google-sans">Start Learning With These Free Courses</h2>
            <p className="text-base sm:text-lg text-muted-foreground font-google-sans max-w-2xl">Choose a short, structured course and build skills step-by-step.</p>
          </div>
          <Button variant="outline" className="w-full sm:w-auto h-12 px-6 font-google-sans font-semibold border-2 hover:bg-primary/5 transition-all duration-300" asChild>
            <Link href="/free-courses">Browse All Courses</Link>
          </Button>
        </div>

        {featuredCourses.length > 0 ? (
          <CourseGridWithEnrollment courses={featuredCourses} />
        ) : (
          <div className="text-center py-16 sm:py-20 text-muted-foreground">
            <p className="text-base sm:text-lg font-google-sans">No courses published yet. Add your first course in the admin dashboard.</p>
          </div>
        )}
      </section>

      {/* Why Choose Us — black bg section */}
      <section className="bg-black text-white py-16 sm:py-20 md:py-24">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-primary mb-5">
              <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-google-sans font-medium">Trusted by Learners Worldwide</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 font-google-sans">Why Choose CodeCraft Academy</h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto font-google-sans">
              Join thousands of learners who have already started their tech journey with us.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto mb-16 sm:mb-20">
            <div className="text-center group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <span className="text-lg sm:text-xl font-bold text-primary font-google-sans">5K+</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-1 font-google-sans">Active Learners</h3>
              <p className="text-xs sm:text-sm text-gray-400 font-google-sans">Students actively learning and growing</p>
            </div>
            <div className="text-center group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <span className="text-lg sm:text-xl font-bold text-secondary font-google-sans">25+</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-1 font-google-sans">Free Courses</h3>
              <p className="text-xs sm:text-sm text-gray-400 font-google-sans">Comprehensive courses covering modern tech</p>
            </div>
            <div className="text-center group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <span className="text-lg sm:text-xl font-bold text-green-500 font-google-sans">4.8</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-1 font-google-sans">Average Rating</h3>
              <p className="text-xs sm:text-sm text-gray-400 font-google-sans">Highly rated by our community</p>
            </div>
            <div className="text-center group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <span className="text-lg sm:text-xl font-bold text-purple-500 font-google-sans">100%</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-1 font-google-sans">Free to Start</h3>
              <p className="text-xs sm:text-sm text-gray-400 font-google-sans">No credit card required</p>
            </div>
          </div>

          {/* How Learning Works — inside same black section */}
          <div className="text-center mb-10 sm:mb-12">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-3 font-google-sans">How Learning Works</h3>
            <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto font-google-sans">
              A simple flow that keeps you moving and building confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto mb-12">
            <div className="text-center group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-base sm:text-lg font-google-sans group-hover:scale-110 transition-transform duration-500">
                1
              </div>
              <h4 className="text-base sm:text-lg font-semibold mb-2 font-google-sans">Pick a Course</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-google-sans">Choose a beginner-friendly course and enroll for free.</p>
            </div>
            <div className="text-center group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-base sm:text-lg font-google-sans group-hover:scale-110 transition-transform duration-500">
                2
              </div>
              <h4 className="text-base sm:text-lg font-semibold mb-2 font-google-sans">Learn by Doing</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-google-sans">Short lessons, videos, quizzes, and mini projects that unlock step-by-step.</p>
            </div>
            <div className="text-center group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-base sm:text-lg font-google-sans group-hover:scale-110 transition-transform duration-500">
                3
              </div>
              <h4 className="text-base sm:text-lg font-semibold mb-2 font-google-sans">Build Skills & Momentum</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-google-sans">Track progress and keep improving with new courses and tutorials.</p>
            </div>
          </div>

          <div className="text-center">
            <Button size="lg" asChild className="h-12 px-8 text-base font-google-sans font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              <Link href="/free-courses">
                <GraduationCap className="h-5 w-5 mr-2" />
                Start Learning Now
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content Area — white bg */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        
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
          <div className="lg:col-span-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight font-google-sans">From the Knowledge Base</h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <PageSearch placeholder="Search articles..." searchPath="/blog" className="flex-1 sm:w-64" />
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 whitespace-nowrap" asChild>
                  <Link href="/blog">View all</Link>
                </Button>
              </div>
            </div>
            
            {latestPosts.length > 0 ? (
              <Suspense fallback={<PageLoading />}>
                <FilteredPosts posts={latestPosts} categories={categories} />
              </Suspense>
            ) : (
              <div className="text-center py-12 sm:py-16 text-muted-foreground">
                <p className="text-sm sm:text-base font-google-sans">No posts yet. Check back soon!</p>
              </div>
            )}

            <div className="mt-8 sm:mt-10 flex justify-center">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 text-base font-google-sans font-medium border-2 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300" asChild>
                <Link href="/blog">View All Posts</Link>
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <SidebarMinimal />
          </aside>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />
    </>
  );
}

