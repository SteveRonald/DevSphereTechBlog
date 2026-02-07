import { sanityClient } from "@/lib/sanity";
import { postsByCategoryQuery } from "@/lib/sanity.queries";
import { PostCard, type Post } from "@/components/blog/PostCard";
import { SidebarMinimal } from "@/components/blog/SidebarMinimal";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

async function getReviews(): Promise<Post[]> {
  try {
    const posts = await sanityClient.fetch<Post[]>(postsByCategoryQuery, { 
      category: "reviews" 
    });
    return posts || [];
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

// Revalidate every 60 seconds to show fresh content from Sanity
export const revalidate = 60;

export default async function ReviewsPage() {
  const posts = await getReviews();

  return (
    <>
      <div className="bg-gradient-to-br from-primary/20 via-background to-background py-12 sm:py-16 md:py-18 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-4 mb-8">
            <Star className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-primary" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-google-sans">Product Reviews</h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl leading-relaxed font-google-sans">
            Honest, in-depth reviews of developer tools, frameworks, libraries, and services. 
            Get insights before you invest your time and money.
          </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8">
            {posts.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
                
                <div className="mt-12 flex justify-center">
                  <Button variant="outline" size="lg" className="h-12 px-7 text-base font-google-sans font-medium border-2 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">Load More</Button>
                </div>
              </>
            ) : (
              <div className="text-center py-16 sm:py-20 text-muted-foreground">
                <Star className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-6 opacity-50" />
                <p className="text-xl sm:text-2xl font-medium mb-3 font-google-sans">No reviews yet</p>
                <p className="text-base sm:text-lg font-google-sans">Check back soon for new product reviews!</p>
              </div>
            )}
          </div>
          
          <aside className="lg:col-span-4">
            <SidebarMinimal />
          </aside>
        </div>
      </div>
    </>
  );
}
