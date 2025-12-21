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

// Revalidate every 60 seconds to show fresh content from Sanity
export const revalidate = 60;

export default async function Home() {
  const [featuredPosts, recentPosts, categories] = await Promise.all([
    getFeaturedPosts(),
    getRecentPosts(),
    getCategories(),
  ]);

  const featuredPost = featuredPosts[0];
  const latestPosts = recentPosts.slice(0, 9);

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
              <span>Start Your Journey Today with CodeCraft Academy</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Master Modern Tech with <br className="hidden sm:inline" />
              <span className="text-gradient">CodeCraft Academy</span>
            </h1>
            <p className="mx-auto max-w-[600px] text-base text-muted-foreground md:text-lg">
              Practical tutorials, in-depth reviews, and career advice to help you advance your tech career.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link href="/tutorials">
                  Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="/#categories">
                  Browse Categories
                </Link>
              </Button>
            </div>
          </div>
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
          <div className="lg:col-span-8" id="categories">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Latest Posts</h2>
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
                <strong className="text-foreground">CodeCraft Academy</strong> is a web development blog and learning platform designed to help developers advance their careers.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We provide practical tutorials, in-depth product reviews, code snippets, and career advice covering modern technologies from React and Next.js to AI and machine learning.
              </p>
            </div>
            <div className="space-y-4 text-left">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our mission is to make quality tech education accessible to developers at all skill levels, from beginners to experienced engineers.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Web Development</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">Tutorials</span>
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

