import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity";
import { postBySlugQuery } from "@/lib/sanity.queries";
import { urlFor } from "@/lib/sanity";
import { Sidebar } from "@/components/blog/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Share2, MessageSquare, ThumbsUp, Bookmark } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { PortableText, type PortableTextBlock } from "@portabletext/react";

interface Post {
  _id: string;
  title: string;
  excerpt: string;
  slug: {
    current: string;
  };
  mainImage?: {
    asset: any;
    alt?: string;
  };
  publishedAt: string;
  readTime: number;
  featured?: boolean;
  body: PortableTextBlock[];
  tags?: string[];
  author?: {
    name: string;
    image?: {
      asset: any;
    };
    role?: string;
    bio?: PortableTextBlock[];
    socialLinks?: {
      twitter?: string;
      github?: string;
      linkedin?: string;
    };
  };
  categories?: Array<{
    title: string;
    slug: {
      current: string;
    };
  }>;
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const post = await sanityClient.fetch<Post>(postBySlugQuery, { slug });
    return post || null;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
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

  const imageUrl = post.mainImage ? urlFor(post.mainImage).width(1200).height(600).url() : "";
  const categoryTitle = post.categories?.[0]?.title || "Uncategorized";
  const formattedDate = post.publishedAt ? format(new Date(post.publishedAt), "MMM dd, yyyy") : "";
  const readTime = `${post.readTime || 5} min read`;
  const authorImageUrl = post.author?.image ? urlFor(post.author.image).width(100).height(100).url() : "";

  return (
    <>
      <div className="bg-muted/30 pb-10">
        {/* Header Section */}
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="max-w-5xl mx-auto">
            <Badge className="mb-4">{categoryTitle}</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-border/50">
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10 border border-border">
                  {authorImageUrl && <AvatarImage src={authorImageUrl} />}
                  <AvatarFallback>{post.author?.name?.[0] || "A"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{post.author?.name || "Anonymous"}</p>
                  {post.author?.role && (
                    <p className="text-xs text-muted-foreground">{post.author.role}</p>
                  )}
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
                alt={post.mainImage?.alt || post.title} 
                width={1200}
                height={600}
                className="w-full h-[400px] md:h-[500px] object-cover"
              />
            </div>
          </div>
        )}
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content */}
          <article className="lg:col-span-8">
            <div className="prose prose-slate dark:prose-invert max-w-none prose-lg
              prose-headings:font-bold prose-headings:tracking-tight
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg prose-pre:bg-muted prose-pre:text-foreground
              prose-p:leading-relaxed prose-li:leading-relaxed">
              <PortableText value={post.body} />
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
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ThumbsUp className="h-4 w-4" /> 42
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" /> 8
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Bookmark className="h-4 w-4" /> Save
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Author Bio Box */}
            {post.author && (
              <div className="mt-10 p-6 bg-muted/30 rounded-lg border border-border flex items-start gap-4">
                <Avatar className="h-16 w-16 border border-border">
                  {authorImageUrl && <AvatarImage src={authorImageUrl} />}
                  <AvatarFallback>{post.author.name?.[0] || "A"}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg mb-1">{post.author.name}</h3>
                  {post.author.bio && (
                    <div className="text-muted-foreground text-sm mb-3">
                      <PortableText value={post.author.bio} />
                    </div>
                  )}
                  {post.author.socialLinks?.twitter && (
                    <Button variant="link" className="p-0 h-auto text-primary" asChild>
                      <a href={post.author.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        Follow on Twitter
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <Sidebar />
          </aside>
        </div>
      </div>
    </>
  );
}

