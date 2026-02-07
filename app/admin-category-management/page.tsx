"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminShell } from "@/components/admin/AdminShell";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { createClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  title: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminCategoryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCategories();
    fetchUser();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      fetchPostCounts();
    }
  }, [categories]);

  const fetchUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("display_name, first_name, last_name")
          .eq("id", user.id)
          .single();
        if (profile) {
          setUserName(
            profile.display_name ||
            `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
            null
          );
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Fetch Supabase categories
      const { data: supabaseCategories, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;

      // Fetch Sanity categories
      let sanityCategories: Category[] = [];
      try {
        const { sanityClient } = await import("@/lib/sanity");
        const sanityQuery = `
          *[_type == "category"]{
            _id,
            title,
            "slug": slug.current,
            description,
            _createdAt,
            _updatedAt
          }
        `;
        const sanityCats = await sanityClient.fetch(sanityQuery);
        
        // Transform Sanity categories to match our interface
        sanityCategories = sanityCats.map((cat: { _id: string; title: string; slug: string; description?: string; _createdAt: string; _updatedAt: string }) => ({
          id: `sanity-${cat._id}`,
          title: cat.title,
          slug: cat.slug,
          description: cat.description,
          created_at: cat._createdAt,
          updated_at: cat._updatedAt,
        }));
      } catch (sanityError) {
        console.error("Error fetching Sanity categories:", sanityError);
      }

      // Merge categories, removing duplicates by slug
      const categoryMap = new Map<string, Category>();
      
      // Add Supabase categories first
      (supabaseCategories || []).forEach((cat: Category) => {
        categoryMap.set(cat.slug, cat);
      });
      
      // Add Sanity categories if slug doesn't exist
      sanityCategories.forEach((cat: Category) => {
        if (!categoryMap.has(cat.slug)) {
          categoryMap.set(cat.slug, cat);
        }
      });

      const mergedCategories = Array.from(categoryMap.values()).sort((a, b) => 
        a.title.localeCompare(b.title)
      );

      setCategories(mergedCategories);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPostCounts = async () => {
    try {
      const counts: Record<string, number> = {};
      
      // 1. Count Supabase posts
      const supabase = createClient();
      const { data, error } = await supabase
        .from("blog_posts")
        .select("category_id")
        .eq("published", true);

      if (!error && data) {
        data.forEach((post: { category_id?: string }) => {
          if (post.category_id) {
            counts[post.category_id] = (counts[post.category_id] || 0) + 1;
          }
        });
      }

      // 2. Count Sanity posts by category slug
      try {
        const { sanityClient } = await import("@/lib/sanity");
        const sanityQuery = `
          *[_type == "post" && publishedAt <= now()]{
            categories[]->{slug}
          }
        `;
        const sanityPosts = await sanityClient.fetch(sanityQuery);
        
        // Count Sanity posts per category slug
        const sanityCategoryCounts: Record<string, number> = {};
        sanityPosts?.forEach((post: any) => {
          post.categories?.forEach((cat: any) => {
            if (cat?.slug?.current) {
              sanityCategoryCounts[cat.slug.current] = (sanityCategoryCounts[cat.slug.current] || 0) + 1;
            }
          });
        });

        // Match Sanity counts to Supabase categories by slug
        categories.forEach((cat) => {
          const sanityCount = sanityCategoryCounts[cat.slug] || 0;
          const currentCount = counts[cat.id] || 0;
          counts[cat.id] = currentCount + sanityCount;
        });
      } catch (sanityError) {
        console.error("Error fetching Sanity post counts:", sanityError);
      }

      setPostCounts(counts);
    } catch (error) {
      console.error("Error fetching post counts:", error);
    }
  };

  const handleDelete = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    const postCount = postCounts[id] || 0;

    if (postCount > 0) {
      toast({
        title: "Cannot Delete",
        description: `This category has ${postCount} published post(s). Please remove or reassign posts before deleting.`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${category?.title}"?`)) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("blog_categories").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      fetchCategories();
      fetchPostCounts();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const filteredCategories = categories.filter((category) =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminShell
      title="Category Management"
      subtitle="Manage blog categories"
      userEmail={userEmail}
      userName={userName}
      onSignOut={handleSignOut}
    >
      {showForm ? (
        <CategoryForm
          category={editingCategory}
          onClose={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingCategory(null);
            fetchCategories();
            fetchPostCounts();
          }}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories by name, slug, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading categories...</div>
          ) : filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No categories found matching your search." : "No categories yet."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Category
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => {
                const postCount = postCounts[category.id] || 0;
                return (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FolderOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base truncate">{category.title}</CardTitle>
                            <CardDescription className="truncate text-xs">
                              /{category.slug}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {category.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="secondary">
                          {postCount} {postCount === 1 ? "post" : "posts"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(category);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          disabled={postCount > 0}
                          className="text-destructive hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}




