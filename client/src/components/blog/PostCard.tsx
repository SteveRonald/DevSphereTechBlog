import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
}

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  if (featured) {
    return (
      <Link href={`/post/${post.id}`}>
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer h-full">
          <div className="grid md:grid-cols-5 gap-0 h-full">
            <div className="md:col-span-3 relative h-64 md:h-full overflow-hidden">
              <img 
                src={post.image} 
                alt={post.title} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r" />
            </div>
            <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-center">
              <div className="mb-4">
                <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  {post.category}
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground space-x-2 mb-3">
                  <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {post.date}</span>
                  <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {post.readTime}</span>
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
    <Link href={`/post/${post.id}`}>
      <Card className="group overflow-hidden border-border h-full flex flex-col cursor-pointer transition-all hover:shadow-md hover:-translate-y-1">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img 
            src={post.image} 
            alt={post.title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <CardHeader className="p-5 pb-2">
          <div className="flex justify-between items-center mb-2">
            <Badge variant="outline" className="text-xs font-normal border-primary/20 text-primary bg-primary/5">
              {post.category}
            </Badge>
            <span className="text-xs text-muted-foreground">{post.readTime}</span>
          </div>
          <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </CardHeader>
        <CardContent className="p-5 pt-2 flex-1">
          <p className="text-muted-foreground text-sm line-clamp-3">
            {post.excerpt}
          </p>
        </CardContent>
        <CardFooter className="p-5 pt-0 mt-auto">
          <div className="flex items-center text-xs text-muted-foreground w-full border-t border-border/50 pt-4">
            <span className="font-medium text-foreground">{post.author}</span>
            <span className="mx-2">•</span>
            <span>{post.date}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
