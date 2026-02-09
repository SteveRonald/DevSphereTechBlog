import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { CommentSection } from "@/components/blog/CommentSection";
import { PostActions } from "@/components/blog/PostActions";
import Image from "next/image";
import { format } from "date-fns";
import { RichMarkdown } from "@/components/RichMarkdown";
import { PortableTextRenderer } from "@/components/PortableTextRenderer";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Post {
  id: string;
  title: string;
  excerpt?: string;
  slug: string;
  content?: string;
  body?: any[];
  content_type?: string;
  main_image_url?: string;
  main_image_alt?: string;
  mainImage?: any;
  published_at?: string;
  publishedAt?: string;
  read_time: number;
  featured?: boolean;
  tags?: string[];
  blog_categories?: {
    title: string;
    slug: string;
  };
  categories?: Array<{
    title: string;
    slug: string;
  }>;
  blog_authors?: {
    id: string;
    name: string;
    image_url?: string;
    role?: string;
    bio?: string;
    bio_html?: string;
  };
  author?: {
    name: string;
    image?: string;
    role?: string;
  };
  user_profiles?: {
    display_name?: string;
    first_name?: string;
    last_name?: string;
  };
  source?: 'supabase';
}

type RelatedLink = {
  title: string;
  slug: string;
};

async function getRelatedPosts(post: Post): Promise<RelatedLink[]> {
  try {
    const { createServerClient } = await import("@/lib/supabase-server");
    const supabase = await createServerClient(undefined);
    const categorySlug = post.blog_categories?.slug;
    if (!categorySlug) return [];

    const { data: category } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();

    if (!category?.id) return [];

    const { data: related } = await supabase
      .from("blog_posts")
      .select("title,slug")
      .eq("published", true)
      .eq("category_id", category.id)
      .neq("slug", post.slug)
      .order("published_at", { ascending: false })
      .limit(4);

    return (related || []).map((p: any) => ({ title: p.title, slug: p.slug }));
  } catch (e) {
    console.error("Error fetching related posts:", e);
    return [];
  }
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const { createServerClient } = await import("@/lib/supabase-server");
    const supabase = await createServerClient(undefined);
    const { data: post, error } = await supabase
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
          role,
          bio,
          bio_html
        )
      `)
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error || !post) {
      return null;
    }

    // Transform Supabase data to unified Post format
    return {
      ...post,
      author: post.blog_authors ? {
        name: post.blog_authors.name,
        image: post.blog_authors.image_url,
        role: post.blog_authors.role,
      } : {
        name: "CodeCraft Academy",
      },
      source: 'supabase',
    };
  } catch (error) {
    console.error("Error fetching Supabase post:", error);
    return null;
  }
}

// Revalidate every 60 seconds to show fresh content
export const revalidate = 60;
export const dynamic = 'force-dynamic';

// Generate static params for better performance and SEO
export async function generateStaticParams() {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("published", true);
    
    return (data || []).map((p: { slug: string }) => ({ slug: p.slug }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const imageUrl = post.main_image_url || "";
  const categoryTitle = post.blog_categories?.title || post.categories?.[0]?.title || "Uncategorized";
  const publishedDate = post.published_at || post.publishedAt;
  const formattedDate = publishedDate ? format(new Date(publishedDate), "MMM dd, yyyy") : "";
  const readTime = `${post.read_time || 5} min read`;
  
  // Unified author handling
  const authorName = post.blog_authors?.name || post.author?.name || "CodeCraft Academy";
  const authorRole = post.blog_authors?.role || post.author?.role;
  const authorImage = post.blog_authors?.image_url || post.author?.image;
  const authorBio = post.blog_authors?.bio_html || post.blog_authors?.bio;
  const relatedPosts = await getRelatedPosts(post);

  return (
    <>
      <div className="bg-muted/30 pb-10">
        {/* Header Section */}
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <div className="max-w-5xl mx-auto">
            <Badge className="mb-3 md:mb-4">{categoryTitle}</Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 md:mb-6 leading-tight">
              {post.title}
            </h1>
            
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-4 border-y border-border/50">
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10 border border-border">
                  {authorImage && <AvatarImage src={authorImage} alt={authorName} />}
                  <AvatarFallback>{authorName[0] || "A"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{authorName}</p>
                  {authorRole && <p className="text-xs text-muted-foreground">{authorRole}</p>}
                </div>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground space-x-4">
                <span className="flex items-center"><Calendar className="h-4 w-4 mr-1.5" /> {formattedDate}</span>
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> {readTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {imageUrl && (
          <div className="container max-w-7xl mx-auto px-4 md:px-6">
            <div className="max-w-6xl mx-auto -mt-6 rounded-xl overflow-hidden shadow-xl">
              <Image 
                src={imageUrl} 
                alt={post.main_image_alt || post.title} 
                width={1200}
                height={630}
                className="w-full h-auto max-h-[520px] object-contain bg-muted/50"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px"
                priority
              />
            </div>
          </div>
        )}
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          
          {/* Main Content */}
          <article className="lg:col-span-8">
            <div className="prose-content">
              {post.content ? (
                <RichMarkdown content={post.content} />
              ) : post.body ? (
                <PortableTextRenderer value={post.body} />
              ) : (
                <p className="text-muted-foreground">No content available</p>
              )}
            </div>
            
            {/* Tags & Share */}
            <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
              
              <PostActions postSlug={post.slug} />
            </div>

            {/* Author Bio Box */}
            {authorBio && (
              <div className="mt-10 p-6 bg-muted/30 rounded-lg border border-border flex items-start gap-4">
                <Avatar className="h-16 w-16 border border-border shrink-0">
                  {authorImage && <AvatarImage src={authorImage} alt={authorName} />}
                  <AvatarFallback>{authorName[0] || "A"}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg mb-1">{authorName}</h3>
                  {post.blog_authors?.bio_html ? (
                    <div className="text-muted-foreground text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: authorBio }} />
                  ) : (
                    <p className="text-muted-foreground text-sm">{authorBio}</p>
                  )}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div id="comments-section" className="mt-12">
              <CommentSection postSlug={post.slug} />
            </div>

          </article>

          {/* Related */}
          <aside className="lg:col-span-4 space-y-8">
            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-google-sans">Related Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {relatedPosts.length > 0 ? (
                  <div className="space-y-3">
                    {relatedPosts.map((p) => (
                      <Link
                        key={p.slug}
                        href={`/blog/${p.slug}`}
                        className="block text-sm font-google-sans text-foreground/80 hover:text-primary transition-colors"
                      >
                        {p.title}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground font-google-sans">No related posts yet</p>
                )}

                <div className="mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/blog">Browse all posts</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}

