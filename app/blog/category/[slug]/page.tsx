import { sanityClient } from "@/lib/sanity";
import { postsByCategoryQuery } from "@/lib/sanity.queries";
import { PostCard, type Post } from "@/components/blog/PostCard";
import { Sidebar } from "@/components/blog/Sidebar";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

async function getPostsByCategory(category: string): Promise<Post[]> {
  try {
    const posts = await sanityClient.fetch<Post[]>(postsByCategoryQuery, { category });
    return posts || [];
  } catch (error) {
    console.error("Error fetching posts by category:", error);
    return [];
  }
}

// Revalidate every 60 seconds to show fresh content from Sanity
export const revalidate = 60;

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = await getPostsByCategory(slug);

  const categoryName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <>
      <div className="bg-muted/30 py-12 border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{categoryName}</h1>
          <p className="text-muted-foreground max-w-3xl">
            Explore our latest articles, tutorials, and insights on {categoryName}. 
            Stay up to date with the best practices in the industry.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {posts.length} {posts.length === 1 ? "post" : "posts"} in this category
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
                <p>No posts found in this category yet.</p>
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

