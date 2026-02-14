import { createAdminClient } from "@/lib/supabase-admin";
import { type Post } from "@/components/blog/PostCard";
import { SidebarMinimal } from "@/components/blog/SidebarMinimal";
import { Star } from "lucide-react";
import { SearchablePostList } from "@/components/blog/SearchablePostList";

async function getReviews(): Promise<Post[]> {
  try {
    const supabase = createAdminClient();
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        id, title, excerpt, slug, main_image_url, published_at, read_time, featured,
        blog_categories (id, title, slug),
        blog_authors:author_id (name, role)
      `)
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }

    return (reviews || []).map((review: any) => ({
      id: review.id,
      title: review.title,
      excerpt: review.excerpt || "",
      slug: review.slug,
      main_image_url: review.main_image_url || undefined,
      published_at: review.published_at,
      read_time: review.read_time || 5,
      featured: review.featured || false,
      blog_categories: review.blog_categories || undefined,
      blog_authors: review.blog_authors || undefined,
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

export const revalidate = 60;
export const dynamic = 'force-dynamic';

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
            <SearchablePostList
              posts={posts}
              searchPlaceholder="Search reviews by tool, framework, service..."
              emptyTitle="No reviews yet"
              emptyMessage="Check back soon for new product reviews!"
              hrefBase="/reviews"
            />
          </div>
          
          <aside className="lg:col-span-4">
            <SidebarMinimal />
          </aside>
        </div>
      </div>
    </>
  );
}
