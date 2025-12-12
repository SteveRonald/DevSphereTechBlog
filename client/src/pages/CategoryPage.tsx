import { Layout } from "@/components/layout/Layout";
import { PostCard, Post } from "@/components/blog/PostCard";
import { Sidebar } from "@/components/blog/Sidebar";
import { Button } from "@/components/ui/button";
import { useRoute } from "wouter";

// Reuse mock data but filter/arrange differently in a real app
const allPosts: Post[] = [
  {
    id: "1",
    title: "Building a Next.js 14 Blog with Tailwind CSS and Sanity.io",
    excerpt: "Learn how to build a modern, high-performance tech blog using the latest features of Next.js 14 App Router.",
    category: "Web Development",
    author: "Alex Dev",
    date: "Dec 12, 2025",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop"
  },
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

export default function CategoryPage() {
  const [match, params] = useRoute("/:category");
  const categoryName = params?.category 
    ? params.category.charAt(0).toUpperCase() + params.category.slice(1)
    : "All Posts";

  return (
    <Layout>
      <div className="bg-muted/30 py-12 border-b border-border">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{categoryName}</h1>
          <p className="text-muted-foreground max-w-2xl">
            Explore our latest articles, tutorials, and insights on {categoryName}. 
            Stay up to date with the best practices in the industry.
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="grid md:grid-cols-2 gap-6">
              {allPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            
            <div className="mt-10 flex justify-center">
              <Button variant="outline" size="lg">Load More</Button>
            </div>
          </div>
          
          <aside className="lg:col-span-4">
            <Sidebar />
          </aside>
        </div>
      </div>
    </Layout>
  );
}
