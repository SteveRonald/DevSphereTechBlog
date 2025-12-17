import { sanityClient } from "@/lib/sanity";
import { postsByCategoryQuery } from "@/lib/sanity.queries";
import { PostCard, type Post } from "@/components/blog/PostCard";
import { Sidebar } from "@/components/blog/Sidebar";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";

async function getSnippets(): Promise<Post[]> {
  try {
    const posts = await sanityClient.fetch<Post[]>(postsByCategoryQuery, { 
      category: "snippets" 
    });
    return posts || [];
  } catch (error) {
    console.error("Error fetching snippets:", error);
    return [];
  }
}

// Revalidate every 60 seconds to show fresh content from Sanity
export const revalidate = 60;

export default async function SnippetsPage() {
  const posts = await getSnippets();

  return (
    <>
      <div className="bg-muted/30 py-12 border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-4">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Code Snippets</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Reusable code snippets, quick tips, and handy utilities to speed up your development workflow. 
            Copy, paste, and customize for your projects.
          </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {posts.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
                
                <div className="mt-10 flex justify-center">
                  <Button variant="outline" size="lg">Load More</Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No snippets yet</p>
                <p className="text-sm">Check back soon for new code snippets!</p>
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
