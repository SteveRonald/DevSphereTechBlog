import { Layout } from "@/components/layout/Layout";
import { PostCard } from "@/components/blog/PostCard";
import { Sidebar } from "@/components/blog/Sidebar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { sanityClient } from "@/lib/sanity";
import { featuredPostsQuery, recentPostsQuery } from "@/lib/sanity.queries";
import type { Post } from "@/components/blog/PostCard";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/loading";
import Link from "next/link";

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

export default async function Home() {
  const [featuredPosts, recentPosts] = await Promise.all([
    getFeaturedPosts(),
    getRecentPosts(),
  ]);

  const featuredPost = featuredPosts[0];
  const otherRecentPosts = recentPosts.slice(0, 5);

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-20 pb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="container max-w-7xl mx-auto relative z-10 px-4 md:px-6 text-center">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              <span>New Learning Path: Full Stack AI Engineer</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Master Modern Tech with <br className="hidden sm:inline" />
              <span className="text-gradient">CodeCraft Academy</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
              Practical tutorials, in-depth reviews, and career advice for developers. 
              From React to AI, we cover what matters most.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
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
      <section className="container max-w-7xl mx-auto px-4 md:px-6 pb-20">
        
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Featured Article</h2>
            </div>
            <PostCard post={featuredPost} featured={true} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Feed */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Latest Posts</h2>
              <Button variant="ghost" className="text-primary hover:text-primary/80" asChild>
                <Link href="/tutorials">View all</Link>
              </Button>
            </div>
            
            {otherRecentPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {otherRecentPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No posts yet. Check back soon!</p>
              </div>
            )}

            <div className="mt-10 flex justify-center">
              <Button variant="outline" size="lg" className="w-full md:w-auto">Load More Articles</Button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <Sidebar />
          </aside>
        </div>
      </section>
    </>
  );
}

