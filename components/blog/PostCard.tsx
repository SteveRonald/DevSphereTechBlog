import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export interface Post {
  id: string;
  title: string;
  excerpt?: string;
  slug: string;
  main_image_url?: string;
  published_at: string;
  read_time?: number;
  featured?: boolean;
  blog_categories?: {
    id: string;
    title: string;
    slug: string;
  } | {
    id: string;
    title: string;
    slug: string;
  }[];
  blog_authors?: {
    name: string;
    role?: string;
  };
}

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const getImageUrl = () => {
    const fallback = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop";
    
    if (!post.main_image_url) {
      return fallback;
    }
    
    // Validate string URL
    return post.main_image_url.startsWith('http') ? post.main_image_url : fallback;
  };

  const imageUrl = getImageUrl();
  
  // Handle categories (could be single object or array)
  const getCategoryTitle = () => {
    if (!post.blog_categories) return "Uncategorized";
    
    if (Array.isArray(post.blog_categories)) {
      return post.blog_categories[0]?.title || "Uncategorized";
    } else {
      return post.blog_categories.title || "Uncategorized";
    }
  };
  
  const categoryTitle = getCategoryTitle();
  const formattedDate = post.published_at ? format(new Date(post.published_at), "MMM dd, yyyy") : "";
  const readTime = `${post.read_time || 5} min read`;

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`}>
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer h-full">
          <div className="grid md:grid-cols-5 gap-0 h-full">
            <div className="md:col-span-3 relative h-64 md:h-full overflow-hidden bg-muted/30">
              <Image 
                src={imageUrl} 
                alt={post.title} 
                fill
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r" />
            </div>
            <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-center">
              <div className="mb-4">
                <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  {categoryTitle}
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground space-x-2 mb-3">
                  <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {formattedDate}</span>
                  <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {readTime}</span>
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-muted-foreground line-clamp-3 mb-6">
                {post.excerpt}
              </p>
              <div className="flex items-center text-sm font-medium text-primary">
                Read Article <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="group overflow-hidden border-border h-full flex flex-col cursor-pointer transition-all hover:shadow-md hover:-translate-y-1">
        <div className="relative aspect-video overflow-hidden bg-muted/30">
          <Image 
            src={imageUrl} 
            alt={post.title} 
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
          />
        </div>
        <CardHeader className="pb-3">
          <Badge variant="secondary" className="w-fit bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            {categoryTitle}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground space-x-2">
            <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {formattedDate}</span>
            <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {readTime}</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <h3 className="text-lg font-semibold tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {post.excerpt}
          </p>
        </CardContent>
        <CardFooter className="pt-3">
          <div className="flex items-center text-sm font-medium text-primary">
            Read Article <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
