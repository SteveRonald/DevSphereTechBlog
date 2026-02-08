import { createServerClient } from "@/lib/supabase-server";
import { PostCard, type Post } from "@/components/blog/PostCard";
import { Sidebar } from "@/components/blog/Sidebar";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  try {
    const supabase = await createServerClient(undefined);
    const { data: category } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();

    if (!category) return [];

    const { data: posts } = await supabase
      .from("blog_posts")
      .select(`
        id, title, excerpt, slug, main_image_url, published_at, read_time, featured,
        blog_categories (id, title, slug),
        blog_authors:blog_author_id (name, role)
      `)
      .eq("published", true)
      .eq("category_id", category.id)
      .order("published_at", { ascending: false });

    return (posts || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt || "",
      slug: post.slug,
      main_image_url: post.main_image_url || undefined,
      published_at: post.published_at,
      read_time: post.read_time || 5,
      featured: post.featured || false,
      blog_categories: post.blog_categories || undefined,
      blog_authors: post.blog_authors || undefined,
    }));
  } catch (error) {
    console.error("Error fetching posts by category:", error);
    return [];
  }
}

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const posts = await getPostsByCategory(category);

  const categoryName = category
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
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {posts.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
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

