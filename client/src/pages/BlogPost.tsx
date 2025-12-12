import { Layout } from "@/components/layout/Layout";
import { Sidebar } from "@/components/blog/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Share2, MessageSquare, ThumbsUp, Bookmark } from "lucide-react";
import { useRoute } from "wouter";

// Mock Data (In a real app, fetch based on ID)
const postData = {
  id: "1",
  title: "Building a Next.js 14 Blog with Tailwind CSS and Sanity.io",
  excerpt: "Learn how to build a modern, high-performance tech blog using the latest features of Next.js 14 App Router, styled with Tailwind CSS, and managed by Sanity CMS.",
  category: "Web Development",
  author: {
    name: "Alex Dev",
    role: "Senior Frontend Engineer",
    avatar: "https://github.com/shadcn.png"
  },
  date: "Dec 12, 2025",
  readTime: "8 min read",
  image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop",
  content: `
    <p class="lead text-xl text-muted-foreground mb-6">
      Next.js 14 introduced the App Router, a paradigm shift in how we build React applications. In this tutorial, we'll explore how to leverage Server Components for optimal performance while building a beautiful blog.
    </p>

    <h2 class="text-2xl font-bold mt-8 mb-4">Why Next.js 14?</h2>
    <p class="mb-4">
      The App Router isn't just a new way to route pages; it's a complete rethink of the React architecture. By default, everything is a Server Component. This means:
    </p>
    <ul class="list-disc pl-6 mb-6 space-y-2">
      <li>Zero client-side JavaScript for static content</li>
      <li>Faster initial page loads</li>
      <li>Direct database access in components (securely!)</li>
      <li>Simplified data fetching with async/await</li>
    </ul>

    <h2 class="text-2xl font-bold mt-8 mb-4">Setting Up the Project</h2>
    <p class="mb-4">
      Let's start by initializing a new Next.js project with Tailwind CSS pre-configured. Open your terminal and run:
    </p>
    
    <div class="bg-muted p-4 rounded-lg font-mono text-sm mb-6 overflow-x-auto">
      <code>npx create-next-app@latest my-tech-blog --typescript --tailwind --eslint</code>
    </div>

    <p class="mb-4">
      Once installed, navigate to your project directory. We'll be using Shadcn UI for our component library because it gives us accessible, unstyled components that we can customize to match our brand.
    </p>

    <h2 class="text-2xl font-bold mt-8 mb-4">Integrating Sanity CMS</h2>
    <p class="mb-4">
      For content management, Sanity is an excellent choice. It offers a real-time editing experience and a flexible content lake. To get started, install the Sanity client:
    </p>

    <div class="bg-muted p-4 rounded-lg font-mono text-sm mb-6 overflow-x-auto">
      <code>npm install next-sanity @sanity/image-url</code>
    </div>

    <p class="mb-4">
      We'll create a schema for our blog posts that includes fields for the title, slug, main image, categories, and the portable text body.
    </p>

    <h2 class="text-2xl font-bold mt-8 mb-4">Styling with Tailwind v4</h2>
    <p class="mb-4">
      Tailwind CSS v4 brings a new engine that is significantly faster. We can use the new <code>@theme</code> directive to define our design tokens directly in CSS.
    </p>

    <blockquote class="border-l-4 border-primary pl-4 italic my-6 text-muted-foreground">
      "The combination of Next.js Server Components and Tailwind CSS provides an unbeatable developer experience for building content-heavy sites."
    </blockquote>

    <h2 class="text-2xl font-bold mt-8 mb-4">Conclusion</h2>
    <p class="mb-4">
      We've just scratched the surface of what's possible. In the next part of this series, we'll implement the comment system using Giscus and add a newsletter subscription form with Resend.
    </p>
  `
};

export default function BlogPost() {
  const [, params] = useRoute("/post/:id");
  const id = params?.id;

  // In a real app, useQuery to fetch post by ID
  // const { data: post } = useQuery(...)

  return (
    <Layout>
      <div className="bg-muted/30 pb-10">
        {/* Header Section */}
        <div className="container px-4 md:px-6 py-10">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4">{postData.category}</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              {postData.title}
            </h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-border/50">
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={postData.author.avatar} />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{postData.author.name}</p>
                  <p className="text-xs text-muted-foreground">{postData.author.role}</p>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground space-x-4">
                <span className="flex items-center"><Calendar className="h-4 w-4 mr-1.5" /> {postData.date}</span>
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> {postData.readTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="container px-4 md:px-6">
          <div className="max-w-5xl mx-auto -mt-6 rounded-xl overflow-hidden shadow-xl">
            <img 
              src={postData.image} 
              alt={postData.title} 
              className="w-full h-[400px] md:h-[500px] object-cover"
            />
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content */}
          <article className="lg:col-span-8">
            <div 
              className="prose prose-slate dark:prose-invert max-w-none 
                prose-headings:font-bold prose-headings:tracking-tight
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-lg prose-pre:bg-muted prose-pre:text-foreground"
              dangerouslySetInnerHTML={{ __html: postData.content }}
            />
            
            {/* Tags & Share */}
            <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Next.js</Badge>
                <Badge variant="outline">React</Badge>
                <Badge variant="outline">Tailwind</Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ThumbsUp className="h-4 w-4" /> 42
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" /> 8
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Bookmark className="h-4 w-4" /> Save
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Author Bio Box */}
            <div className="mt-10 p-6 bg-muted/30 rounded-lg border border-border flex items-start gap-4">
              <Avatar className="h-16 w-16 border border-border">
                <AvatarImage src={postData.author.avatar} />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg mb-1">{postData.author.name}</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Alex is a Senior Frontend Engineer with over 10 years of experience. He loves writing about React, TypeScript, and modern web performance.
                </p>
                <Button variant="link" className="p-0 h-auto text-primary">Follow on Twitter</Button>
              </div>
            </div>

          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <Sidebar />
          </aside>
        </div>
      </div>
    </Layout>
  );
}
