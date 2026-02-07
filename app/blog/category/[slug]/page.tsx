import { createServerClient } from "@/lib/supabase-server";
import { PostCard, type Post } from "@/components/blog/PostCard";
import { Sidebar } from "@/components/blog/Sidebar";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  try {
    const allPosts: Post[] = [];

    // 1. Fetch from Sanity
    try {
      const { sanityClient } = await import("@/lib/sanity");
      const sanityQuery = `
        *[_type == "post" && publishedAt <= now() && references(*[_type == "category" && slug.current == $categorySlug]._id)]{
          _id,
          title,
          excerpt,
          slug,
          "mainImage": mainImage.asset->url,
          "mainImageAlt": mainImage.alt,
          publishedAt,
          "readTime": round(length(pt::text(body)) / 5 / 180),
          featured,
          "tags": categories[]->title,
          author->{
            name,
            "image": image.asset->url
          },
          categories[]->{
            title,
            slug
          }
        } | order(publishedAt desc)
      `;
      
      const sanityPosts = await sanityClient.fetch(sanityQuery, { categorySlug });
      
      if (sanityPosts && sanityPosts.length > 0) {
        allPosts.push(...sanityPosts.map((post: any) => ({
          _id: post._id,
          title: post.title,
          excerpt: post.excerpt || "",
          slug: post.slug,
          mainImage: post.mainImage,
          publishedAt: post.publishedAt,
          readTime: post.readTime || 5,
          featured: post.featured || false,
          tags: post.tags || [],
          author: post.author || { name: "CodeCraft Academy" },
          categories: post.categories || [],
        })));
      }
    } catch (sanityError) {
      console.error("Error fetching Sanity posts by category:", sanityError);
    }

    // 2. Fetch from Supabase
    try {
      const supabase = await createServerClient(undefined);
      
      const { data: category, error: catError } = await supabase
        .from("blog_categories")
        .select("id, title, slug")
        .eq("slug", categorySlug)
        .single();

      if (!catError && category) {
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
          .eq("category_id", category.id)
          .order("published_at", { ascending: false });

        if (!error && posts) {
          allPosts.push(...posts.map((post: any) => ({
            _id: post.id,
            title: post.title,
            excerpt: post.excerpt || "",
            slug: {
              current: post.slug,
            },
            mainImage: post.main_image_url || undefined,
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
          })));
        }
      }
    } catch (supabaseError) {
      console.error("Error fetching Supabase posts by category:", supabaseError);
    }

    // Sort all posts by date
    return allPosts.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching posts by category:", error);
    return [];
  }
}

// Revalidate every 60 seconds to show fresh content
export const revalidate = 60;
export const dynamic = 'force-dynamic';

// Generate static params for category pages
export async function generateStaticParams() {
  try {
    const params: { slug: string }[] = [];
    
    // Get Supabase categories only
    try {
      const { createServerClient } = await import("@/lib/supabase-server");
      const supabase = await createServerClient(undefined);
      const { data } = await supabase
        .from("blog_categories")
        .select("slug");
      if (data) {
        params.push(...data.map((c: { slug: string }) => ({ slug: c.slug })));
      }
    } catch (e) {
      console.error("Error fetching Supabase category slugs:", e);
    }
    
    // Deduplicate by slug
    const uniqueSlugs = Array.from(new Set(params.map(p => p.slug)));
    return uniqueSlugs.map(slug => ({ slug }));
  } catch (error) {
    console.error("Error generating static params for categories:", error);
    return [];
  }
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = await getPostsByCategory(slug);

  // Get category name from first post or format slug
  const categoryName = posts[0]?.categories?.[0]?.title || 
    slug
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

