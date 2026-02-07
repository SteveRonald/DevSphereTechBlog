"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface Category {
  id?: string;
  title: string;
  slug?: string;
  description?: string;
}

interface CategoryFormProps {
  category?: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryForm({ category, onClose, onSuccess }: CategoryFormProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Category>({
    title: "",
    slug: "",
    description: "",
    ...category,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: formData.slug || generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug) {
      formData.slug = generateSlug(formData.title);
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast({
        title: "Error",
        description: "Slug can only contain lowercase letters, numbers, and hyphens",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();

      if (category?.id) {
        // Check if slug is already taken by another category
        const { data: existing } = await supabase
          .from("blog_categories")
          .select("id")
          .eq("slug", formData.slug)
          .neq("id", category.id)
          .single();

        if (existing) {
          toast({
            title: "Error",
            description: "A category with this slug already exists",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from("blog_categories")
          .update({
            title: formData.title,
            slug: formData.slug,
            description: formData.description || null,
          })
          .eq("id", category.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        // Check if slug already exists
        const { data: existing } = await supabase
          .from("blog_categories")
          .select("id")
          .eq("slug", formData.slug)
          .single();

        if (existing) {
          toast({
            title: "Error",
            description: "A category with this slug already exists",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.from("blog_categories").insert([
          {
            title: formData.title,
            slug: formData.slug,
            description: formData.description || null,
          },
        ]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{category ? "Edit Category" : "Create New Category"}</CardTitle>
            <CardDescription>
              {category ? "Update category information" : "Add a new category for your blog"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Web Development"
              required
            />
            <p className="text-xs text-muted-foreground">
              The display name for this category
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                })
              }
              placeholder="web-development"
              required
            />
            <p className="text-xs text-muted-foreground">
              URL-friendly version of the title (lowercase, hyphens only)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Articles about web development technologies and practices"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Optional description for this category
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {category ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}




