"use client";

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit, Trash2, Eye, FileText, Search } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { AdminShell } from "@/components/admin/AdminShell";
import { BlogPostFormEnhanced } from "@/components/admin/BlogPostFormEnhanced";

interface BlogCategory {
  id: string;
  title: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  content_type: string;
  main_image_url?: string;
  main_image_alt?: string;
  author_id?: string;
  category_id?: string;
  featured: boolean;
  published: boolean;
  published_at?: string;
  read_time: number;
  tags?: string[];
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  save_count: number;
  created_at: string;
  updated_at: string;
  blog_categories?: {
    title: string;
    slug: string;
  };
}

export default function AdminBlogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/auth?redirect=/admin-blog-management");
    }
  }, [user, authLoading, router, mounted]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || authLoading) {
        setCheckingAdmin(true);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (error) {
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.is_admin === true);
        }
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (mounted && user && !authLoading) {
      checkAdmin();
    } else if (mounted && !user && !authLoading) {
      setCheckingAdmin(false);
    }
  }, [user, mounted, authLoading]);

  useEffect(() => {
    if (isAdmin === true) {
      fetchPosts();
    }
  }, [isAdmin]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch categories separately and merge
      if (data && data.length > 0) {
        const categoryIds = [...new Set(data.map((p: any) => p.category_id).filter(Boolean))];
        if (categoryIds.length > 0) {
          const { data: categories } = await supabase
            .from("blog_categories")
            .select("id, title, slug")
            .in("id", categoryIds);
          
          const categoryMap = new Map(categories?.map((category: BlogCategory) => [category.id, category]) || []);
          const postsWithCategories = data.map((post: BlogPost) => ({
            ...post,
            blog_categories: post.category_id ? categoryMap.get(post.category_id) : null
          }));
          setPosts(postsWithCategories);
        } else {
          setPosts(data);
        }
      } else {
        setPosts(data || []);
      }
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch blog posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingPostId(postId);
      const supabase = createClient();
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      fetchPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (checkingAdmin || authLoading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <AdminShell
      title="Blog Management"
      subtitle="Create and manage blog posts"
      userEmail={user?.email || null}
      userName={user?.user_metadata?.name || null}
      onSignOut={handleSignOut}
    >
      {showPostForm ? (
        <BlogPostFormEnhanced
          post={editingPost}
          onClose={() => {
            setShowPostForm(false);
            setEditingPost(null);
          }}
          onSuccess={() => {
            setShowPostForm(false);
            setEditingPost(null);
            fetchPosts();
          }}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Blog Posts</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your blog content
              </p>
            </div>
            <Button onClick={() => setShowPostForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">No posts found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : "Get started by creating your first blog post"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowPostForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {post.main_image_url && (
                        <div className="relative w-full sm:w-32 h-48 sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={post.main_image_url}
                            alt={post.main_image_alt || post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold mb-1 line-clamp-2">{post.title}</h3>
                            {post.excerpt && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.excerpt}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge variant={post.published ? "default" : "secondary"}>
                            {post.published ? "Published" : "Draft"}
                          </Badge>
                          {post.featured && (
                            <Badge variant="outline">Featured</Badge>
                          )}
                          {post.blog_categories && (
                            <Badge variant="outline">{post.blog_categories.title}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {post.read_time} min read
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>Views: {post.view_count}</span>
                          <span>Likes: {post.like_count}</span>
                          <span>Comments: {post.comment_count}</span>
                          <span>Shares: {post.share_count}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPost(post);
                              setShowPostForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(post.id)}
                            disabled={deletingPostId === post.id}
                          >
                            {deletingPostId === post.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}




