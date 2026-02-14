import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Star } from "lucide-react";
import { RichMarkdown } from "@/components/RichMarkdown";
import { createAdminClient } from "@/lib/supabase-admin";

interface Review {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  content_type?: string;
  main_image_url?: string;
  main_image_alt?: string;
  published_at?: string;
  read_time?: number;
  featured?: boolean;
  rating?: number;
  product_name?: string;
  product_url?: string;
  pros?: string;
  cons?: string;
  tags?: string[];
  blog_categories?: {
    title: string;
    slug: string;
  };
  blog_authors?: {
    id: string;
    name: string;
    image_url?: string;
    role?: string;
    bio?: string;
    bio_html?: string;
  };
}

async function getReview(slug: string): Promise<Review | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        blog_categories (
          title,
          slug
        ),
        blog_authors:author_id (
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

    if (error || !data) {
      return null;
    }

    return data as Review;
  } catch (error) {
    console.error("Error fetching review:", error);
    return null;
  }
}

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = await getReview(slug);

  if (!review) {
    notFound();
  }

  const formattedDate = review.published_at ? format(new Date(review.published_at), "MMM dd, yyyy") : "";
  const readTime = `${review.read_time || 5} min read`;
  const categoryTitle = review.blog_categories?.title || "Review";
  const authorName = review.blog_authors?.name || "CodeCraft Academy";
  const authorRole = review.blog_authors?.role;
  const authorImage = review.blog_authors?.image_url;

  return (
    <>
      <div className="bg-muted/30 pb-10">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <div className="max-w-5xl mx-auto">
            <Badge className="mb-3 md:mb-4">{categoryTitle}</Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 md:mb-6 leading-tight">
              {review.title}
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

            <div className="mt-4 flex flex-wrap items-center gap-4">
              {typeof review.rating === "number" && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${s <= (review.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium text-foreground">{review.rating}/5</span>
                </div>
              )}
              {review.product_name && (
                <span className="text-sm text-muted-foreground">
                  Product: <span className="font-medium text-foreground">{review.product_name}</span>
                </span>
              )}
              {review.product_url && (
                <Link href={review.product_url} className="text-sm text-primary underline hover:text-primary/80" target="_blank">
                  Visit product site
                </Link>
              )}
            </div>
          </div>
        </div>

        {review.main_image_url && (
          <div className="container max-w-7xl mx-auto px-4 md:px-6">
            <div className="max-w-6xl mx-auto -mt-6 rounded-xl overflow-hidden shadow-xl">
              <Image
                src={review.main_image_url}
                alt={review.main_image_alt || review.title}
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
          <article className="lg:col-span-8">
            <div className="prose-content">
              {review.content ? <RichMarkdown content={review.content} /> : <p className="text-muted-foreground">No content available</p>}
            </div>

            {review.pros && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4 text-green-600">Pros</h2>
                <RichMarkdown content={review.pros} />
              </div>
            )}

            {review.cons && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4 text-red-600">Cons</h2>
                <RichMarkdown content={review.cons} />
              </div>
            )}

            {review.tags && review.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-2">
                {review.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
          </article>

          <aside className="lg:col-span-4 space-y-8">
            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-google-sans">More Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/reviews" className="text-sm font-google-sans text-foreground/80 hover:text-primary transition-colors">
                  Browse all reviews
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}
