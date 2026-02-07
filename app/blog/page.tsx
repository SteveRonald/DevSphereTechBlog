import { PostCard, type Post } from "@/components/blog/PostCard";
import { SidebarMinimal } from "@/components/blog/SidebarMinimal";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

async function getAllPosts(): Promise<Post[]> {
  try {
    const { createServerClient } = await import("@/lib/supabase-server");
    
    let allPosts: Post[] = [];
    
    // Fetch from Supabase only
    try {
      const supabasePosts = await getSupabasePosts();
      allPosts = [...allPosts, ...supabasePosts];
    } catch (supabaseError) {
      console.error("Error fetching from Supabase:", supabaseError);
    }
    
    // Sort by published date
    allPosts.sort((a, b) => {
      const dateA = new Date(a.publishedAt);
      const dateB = new Date(b.publishedAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    return allPosts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// Fallback function to fetch from Supabase only
async function getSupabasePosts(): Promise<Post[]> {
  try {
    const { createServerClient } = await import("@/lib/supabase-server");
    const supabase = await createServerClient(undefined);
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select(`
        *,
        blog_categories (
          title,
          slug
        ),
        blog_authors:blog_author_id (
          id,
          name,
          image_url,
          role
        )
      `)
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching Supabase posts:", error);
      return [];
    }

    // Transform Supabase data to Post format
    return (posts || []).map((post: any) => ({
      _id: post.id,
      title: post.title,
      excerpt: post.excerpt || "",
      slug: {
        current: post.slug,
      },
      mainImage: post.main_image_url ? {
        asset: {
          _ref: post.main_image_url,
          _type: "image",
        },
        alt: post.main_image_alt,
      } : undefined,
      publishedAt: post.published_at || post.created_at,
      readTime: post.read_time || 5,
      featured: post.featured || false,
      tags: post.tags || [],
      author: post.blog_authors ? {
        name: post.blog_authors.name,
        image: post.blog_authors.image_url,
      } : {
        name: "CodeCraft Academy",
      },
      categories: post.blog_categories ? [{
        title: post.blog_categories.title,
        slug: {
          current: post.blog_categories.slug,
        },
      }] : [],
      source: 'supabase',
    }));
  } catch (error) {
    console.error("Error fetching Supabase posts:", error);
    return [];
  }
}

// Revalidate every 60 seconds to show fresh content
export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <>
      <div className="bg-gradient-to-br from-primary/20 via-background to-background py-12 sm:py-16 md:py-18 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-4 mb-8">
            <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-primary" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-google-sans">All Posts</h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl leading-relaxed font-google-sans">
            Browse all our articles, tutorials, reviews, and code snippets. 
            Find what you're looking for or discover something new.
          </p>
          <p className="text-base text-muted-foreground mt-4 font-google-sans">
            {posts.length} {posts.length === 1 ? "post" : "posts"} total
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
                <BookOpen className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-6 opacity-50" />
                <p className="text-xl sm:text-2xl font-medium mb-3 font-google-sans">No posts yet</p>
                <p className="text-base sm:text-lg font-google-sans">Check back soon for new content!</p>
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
