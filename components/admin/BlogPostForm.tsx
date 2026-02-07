"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X, Upload, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

interface BlogPost {
  id?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  content_type: string;
  main_image_url?: string;
  main_image_alt?: string;
  category_id?: string;
  blog_author_id?: string;
  featured: boolean;
  published: boolean;
  published_at?: string;
  read_time: number;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
}

interface BlogPostFormProps {
  post?: BlogPost | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BlogPostForm({ post, onClose, onSuccess }: BlogPostFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [authors, setAuthors] = useState<Array<{ id: string; name: string; role?: string }>>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(post?.main_image_url || null);
  
  const [formData, setFormData] = useState<BlogPost>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    content_type: "markdown",
    main_image_url: "",
    main_image_alt: "",
    category_id: "",
    blog_author_id: "",
    featured: false,
    published: false,
    read_time: 5,
    tags: [],
    meta_title: "",
    meta_description: "",
    ...(post
      ? {
          id: (post as any).id,
          title: (post as any).title,
          slug: (post as any).slug,
          excerpt: (post as any).excerpt,
          content: (post as any).content,
          content_type: (post as any).content_type,
          main_image_url: (post as any).main_image_url,
          main_image_alt: (post as any).main_image_alt,
          category_id: (post as any).category_id,
          blog_author_id: (post as any).blog_author_id,
          featured: (post as any).featured,
          published: (post as any).published,
          published_at: (post as any).published_at,
          read_time: (post as any).read_time,
          meta_title: (post as any).meta_title,
          meta_description: (post as any).meta_description,
          tags: (post as any).tags,
        }
      : {}),
  });

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
  }, []);

  const fetchCategories = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("blog_categories")
        .select("id, title, slug")
        .order("title");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchAuthors = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("blog_authors")
        .select("id, name, role")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setAuthors(data || []);
    } catch (error: any) {
      console.error("Error fetching authors:", error);
    }
  };

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
      meta_title: formData.meta_title || title,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("uploads").getPublicUrl(filePath);
      
      setFormData({
        ...formData,
        main_image_url: data.publicUrl,
      });
      setImagePreview(data.publicUrl);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const calculateReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200)); // 200 words per minute
  };

  const handleContentChange = (content: string) => {
    const readTime = calculateReadTime(content);
    setFormData({
      ...formData,
      content,
      read_time: readTime,
    });
  };

  const handleSubmit = async (publish: boolean) => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "Error",
        description: "Content is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug) {
      formData.slug = generateSlug(formData.title);
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const postData = {
        ...formData,
        category_id: formData.category_id || null,
        blog_author_id: formData.blog_author_id || null,
        published: publish,
        published_at: publish ? new Date().toISOString() : null,
        author_id: user?.id, // Keep for backward compatibility
        created_by: user?.id,
        updated_by: user?.id,
      };

      if (post?.id) {
        const { error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", post.id);

        if (error) throw error;

        // Send notification if publishing (and wasn't published before)
        if (publish && !post.published) {
          try {
            await fetch("/api/newsletter/notify-new-post", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                post: {
                  title: formData.title,
                  slug: formData.slug,
                  excerpt: formData.excerpt || "",
                  mainImage: formData.main_image_url ? {
                    url: formData.main_image_url,
                    alt: formData.main_image_alt || formData.title,
                  } : undefined,
                  publishedAt: new Date().toISOString(),
                  categories: formData.category_id ? [{
                    title: categories.find(c => c.id === formData.category_id)?.title || "Blog",
                  }] : [],
                  author: formData.blog_author_id ? {
                    name: authors.find(a => a.id === formData.blog_author_id)?.name || "Unknown",
                  } : undefined,
                },
              }),
            });
          } catch (notifyError) {
            console.error("Failed to send notifications:", notifyError);
            // Don't fail the save if notification fails
          }
        }

        toast({
          title: "Success",
          description: publish ? "Post published successfully" : "Post saved as draft",
        });
      } else {
        const { error } = await supabase
          .from("blog_posts")
          .insert([postData]);

        if (error) throw error;

        // Send notification if publishing new post
        if (publish) {
          try {
            await fetch("/api/newsletter/notify-new-post", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                post: {
                  title: formData.title,
                  slug: formData.slug,
                  excerpt: formData.excerpt || "",
                  mainImage: formData.main_image_url ? {
                    url: formData.main_image_url,
                    alt: formData.main_image_alt || formData.title,
                  } : undefined,
                  publishedAt: new Date().toISOString(),
                  categories: formData.category_id ? [{
                    title: categories.find(c => c.id === formData.category_id)?.title || "Blog",
                  }] : [],
                },
              }),
            });
          } catch (notifyError) {
            console.error("Failed to send notifications:", notifyError);
            // Don't fail the save if notification fails
          }
        }

        toast({
          title: "Success",
          description: publish ? "Post published successfully" : "Post saved as draft",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{post ? "Edit Post" : "New Post"}</CardTitle>
            <CardDescription>
              {post ? "Update your blog post" : "Create a new blog post"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Enter post title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="post-url-slug"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="Brief description of the post"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Write your post content (Markdown supported)"
            rows={15}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Estimated read time: {formData.read_time} minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id || "none"}
              onValueChange={(value) => setFormData({ ...formData, category_id: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Select
              value={formData.blog_author_id || "none"}
              onValueChange={(value) => setFormData({ ...formData, blog_author_id: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an author" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Author</SelectItem>
                {authors.map((author) => (
                  <SelectItem key={author.id} value={author.id}>
                    {author.name} {author.role ? `(${author.role})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={formData.tags?.join(", ") || ""}
            onChange={(e) => {
              const tags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
              setFormData({ ...formData, tags });
            }}
            placeholder="react, nextjs, tutorial"
          />
        </div>

        <div className="space-y-2">
          <Label>Featured Image</Label>
          {imagePreview && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted mb-2">
              <Image
                src={imagePreview}
                alt={formData.main_image_alt || "Preview"}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
              id="image-upload"
            />
            <Label htmlFor="image-upload" className="cursor-pointer">
              <Button type="button" variant="outline" disabled={uploading} asChild>
                <span>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {imagePreview ? "Change Image" : "Upload Image"}
                </span>
              </Button>
            </Label>
            {imagePreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImagePreview(null);
                  setFormData({ ...formData, main_image_url: "" });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image-alt">Image Alt Text</Label>
          <Input
            id="image-alt"
            value={formData.main_image_alt}
            onChange={(e) => setFormData({ ...formData, main_image_alt: e.target.value })}
            placeholder="Describe the image for accessibility"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta-title">SEO Title</Label>
          <Input
            id="meta-title"
            value={formData.meta_title}
            onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
            placeholder="SEO meta title (defaults to post title)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta-description">SEO Description</Label>
          <Textarea
            id="meta-description"
            value={formData.meta_description}
            onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
            placeholder="SEO meta description"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
            />
            <Label htmlFor="featured">Featured</Label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Save Draft
          </Button>
          <Button onClick={() => handleSubmit(true)} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {post?.published ? "Update & Publish" : "Publish"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

