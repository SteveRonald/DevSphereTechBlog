import { Layout } from "@/components/layout/Layout";
import { PostCard, Post } from "@/components/blog/PostCard";
import { Sidebar } from "@/components/blog/Sidebar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

// Mock Data
const featuredPost: Post = {
  id: "1",
  title: "Building a Next.js 14 Blog with Tailwind CSS and Sanity.io",
  excerpt: "Learn how to build a modern, high-performance tech blog using the latest features of Next.js 14 App Router, styled with Tailwind CSS, and managed by Sanity CMS.",
  category: "Web Development",
  author: "Alex Dev",
  date: "Dec 12, 2025",
  readTime: "8 min read",
  image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop",
  featured: true
};

const recentPosts: Post[] = [
  {
    id: "2",
    title: "Getting Started with AI: A Developer's Guide to LLMs",
    excerpt: "Understanding Large Language Models and how to integrate OpenAI's GPT-4 API into your applications.",
    category: "AI & Machine Learning",
    author: "Sarah Code",
    date: "Dec 10, 2025",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: "3",
    title: "Mastering TypeScript Generics for Better Code",
    excerpt: "Deep dive into TypeScript generics, utility types, and how to write more reusable and type-safe code.",
    category: "Coding Tutorials",
    author: "Mike Types",
    date: "Dec 08, 2025",
    readTime: "12 min read",
    image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2031&auto=format&fit=crop"
  },
  {
    id: "4",
    title: "VS Code Extensions You Can't Live Without in 2025",
    excerpt: "A curated list of the most productivity-boosting VS Code extensions for web developers this year.",
    category: "Product Reviews",
    author: "Alex Dev",
    date: "Dec 05, 2025",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1607799275518-d58665d096b1?q=80&w=2064&auto=format&fit=crop"
  },
  {
    id: "5",
    title: "React Server Components Explained Simply",
    excerpt: "What are React Server Components? Why do they matter? And how do they change the way we build apps?",
    category: "Web Development",
    author: "Sarah Code",
    date: "Dec 02, 2025",
    readTime: "10 min read",
    image: "https://images.unsplash.com/photo-1633356122102-3fe601e15702?q=80&w=2071&auto=format&fit=crop"
  }
];

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-20 pb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="container relative z-10 px-4 md:px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl space-y-4"
          >
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
              From React to AI, we cover what matters.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button size="lg" className="h-12 px-8 text-base">
                Start Learning <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Browse Categories
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container px-4 md:px-6 pb-20">
        
        {/* Featured Post */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Featured Article</h2>
          </div>
          <PostCard post={featuredPost} featured={true} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Feed */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Latest Posts</h2>
              <Button variant="ghost" className="text-primary hover:text-primary/80">View all</Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

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
    </Layout>
  );
}
