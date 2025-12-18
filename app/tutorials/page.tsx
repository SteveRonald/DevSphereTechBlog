import { sanityClient } from "@/lib/sanity";
import { postsByCategoryQuery } from "@/lib/sanity.queries";
import { PostCard, type Post } from "@/components/blog/PostCard";
import { Sidebar } from "@/components/blog/Sidebar";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

async function getTutorials(): Promise<Post[]> {
  try {
    const posts = await sanityClient.fetch<Post[]>(postsByCategoryQuery, { 
      category: "tutorials" 
    });
    return posts || [];
  } catch (error) {
    console.error("Error fetching tutorials:", error);
    return [];
  }
}

// Revalidate every 60 seconds to show fresh content from Sanity
export const revalidate = 60;

export default async function TutorialsPage() {
  const posts = await getTutorials();

  return (
    <>
      <div className="bg-muted/30 py-12 border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Tutorials</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Step-by-step guides and tutorials to help you learn new technologies, frameworks, and best practices. 
            From beginner-friendly introductions to advanced techniques.
          </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-8">
            {posts.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
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
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No tutorials yet</p>
                <p className="text-sm">Check back soon for new tutorials!</p>
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
