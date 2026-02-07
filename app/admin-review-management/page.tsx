"use client";

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit, Trash2, Eye, Star, Search } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { AdminShell } from "@/components/admin/AdminShell";
import { ReviewForm } from "@/components/admin/ReviewForm";

interface Review {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  content_type?: string;
  main_image_url?: string;
  main_image_alt?: string;
  author_id?: string;
  category_id?: string;
  product_name: string;
  product_url?: string;
  rating?: number;
  pros?: string;
  cons?: string;
  featured: boolean;
  published: boolean;
  read_time?: number;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  blog_categories?: {
    title: string;
    slug: string;
  };
  blog_authors?: {
    name: string;
  };
}

export default function AdminReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/auth?redirect=/admin-review-management");
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
      fetchReviews();
    }
  }, [isAdmin]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/reviews");
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingReviewId(reviewId);
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete review");

      toast({
        title: "Success",
        description: "Review deleted successfully",
      });

      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const filteredReviews = reviews.filter((review) =>
    review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.product_name.toLowerCase().includes(searchQuery.toLowerCase())
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
      title="Review Management"
      subtitle="Create and manage product reviews"
      userEmail={user?.email || null}
      userName={user?.user_metadata?.name || null}
      onSignOut={handleSignOut}
    >
      {showReviewForm ? (
        <ReviewForm
          review={editingReview}
          onClose={() => {
            setShowReviewForm(false);
            setEditingReview(null);
          }}
          onSuccess={() => {
            setShowReviewForm(false);
            setEditingReview(null);
            fetchReviews();
          }}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Product Reviews</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage product and service reviews
              </p>
            </div>
            <Button onClick={() => setShowReviewForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Review
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
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
          ) : filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">No reviews found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : "Get started by creating your first review"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowReviewForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Review
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredReviews.map((review) => (
                <Card key={review.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {review.main_image_url && (
                        <img
                          src={review.main_image_url}
                          alt={review.title}
                          className="w-full sm:w-32 h-32 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold mb-1 line-clamp-2">{review.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{review.product_name}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge variant={review.published ? "default" : "secondary"}>
                            {review.published ? "Published" : "Draft"}
                          </Badge>
                          {review.featured && (
                            <Badge variant="outline">Featured</Badge>
                          )}
                          {review.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{review.rating}/5</span>
                            </div>
                          )}
                          {review.blog_categories && (
                            <Badge variant="outline">{review.blog_categories.title}</Badge>
                          )}
                        </div>
                        {review.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {review.excerpt}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground mb-3">
                          Created: {new Date(review.created_at).toLocaleDateString()}
                          {review.blog_authors && (
                            <span> • By {review.blog_authors.name}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/reviews/${review.slug}`} target="_blank">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingReview(review);
                              setShowReviewForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(review.id)}
                            disabled={deletingReviewId === review.id}
                          >
                            {deletingReviewId === review.id ? (
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
