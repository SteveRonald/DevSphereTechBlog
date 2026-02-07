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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Upload, Image as ImageIcon, Eye, Edit } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { RichMarkdown } from "@/components/RichMarkdown";

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

interface Category {
  id: string;
  title: string;
  slug: string;
}

interface Author {
  id: string;
  name: string;
  image_url?: string;
  role?: string;
}

interface BlogPostFormProps {
  post?: BlogPost | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BlogPostFormEnhanced({ post, onClose, onSuccess }: BlogPostFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingContent, setUploadingContent] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(post?.main_image_url || null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [activeTab, setActiveTab] = useState("edit");
  const [tagInput, setTagInput] = useState("");
  const contentTextareaRef = useState<HTMLTextAreaElement | null>(null);

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
  });

  useEffect(() => {
    if (post) {
      const {
        id,
        title,
        slug,
        excerpt,
        content,
        content_type,
        main_image_url,
        main_image_alt,
        category_id,
        blog_author_id,
        featured,
        published,
        published_at,
        read_time,
        meta_title,
        meta_description,
        tags,
      } = post as any;

      setFormData({
        id,
        title,
        slug,
        excerpt,
        content,
        content_type,
        main_image_url,
        main_image_alt,
        category_id,
        blog_author_id,
        featured,
        published,
        published_at,
        read_time,
        meta_title,
        meta_description,
        tags: tags || [],
      });
      setImagePreview(post.main_image_url || null);
    }
  }, [post]);

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
  }, []);

  const fetchCategories = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("blog_categories")
        .select("*")
        .order("title");
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchAuthors = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("blog_authors")
        .select("*")
        .order("name");
      setAuthors(data || []);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      meta_title: prev.meta_title || title,
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("course-assets")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("course-assets")
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        main_image_url: data.publicUrl,
      }));
      setImagePreview(data.publicUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleContentImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingContent(true);
    try {
      const supabase = createClient();
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("course-assets")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("course-assets")
        .getPublicUrl(filePath);

      // Insert markdown image syntax at cursor position
      const imageMarkdown = `\n![Image description](${data.publicUrl})\n`;
      const textarea = contentTextareaRef[0];
      
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentContent = formData.content;
        const newContent = currentContent.substring(0, start) + imageMarkdown + currentContent.substring(end);
        
        setFormData(prev => ({
          ...prev,
          content: newContent,
        }));
        
        // Set cursor position after inserted image
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
          textarea.focus();
        }, 0);
      } else {
        // Fallback: append to end
        setFormData(prev => ({
          ...prev,
          content: prev.content + imageMarkdown,
        }));
      }
      
      toast({
        title: "Success",
        description: "Image inserted into content",
      });
    } catch (error: any) {
      console.error("Error uploading content image:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingContent(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  const handleSave = async (publish: boolean = false) => {
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

    // Auto-generate excerpt if not provided
    if (!formData.excerpt) {
      const plainText = formData.content.replace(/[#*`_~\[\]()]/g, "").trim();
      formData.excerpt = plainText.substring(0, 200) + (plainText.length > 200 ? "..." : "");
    }

    // Calculate read time
    const wordCount = formData.content.split(/\s+/).length;
    formData.read_time = Math.max(1, Math.ceil(wordCount / 200));

    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const postData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        content_type: formData.content_type,
        main_image_url: formData.main_image_url,
        main_image_alt: formData.main_image_alt,
        category_id: formData.category_id || null,
        blog_author_id: formData.blog_author_id || null,
        featured: formData.featured,
        published: publish,
        published_at: publish ? new Date().toISOString() : null,
        read_time: formData.read_time,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        tags: formData.tags || [],
        author_id: user?.id,
        created_by: user?.id,
        updated_by: user?.id,
      };

      const wasUnpublished = !post?.published;
      let newPostSlug = formData.slug;

      if (post?.id) {
        const { error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", post.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: publish ? "Post published successfully" : "Post saved as draft",
        });
      } else {
        const { data: newPost, error } = await supabase
          .from("blog_posts")
          .insert([postData])
          .select()
          .single();

        if (error) throw error;
        if (newPost) newPostSlug = newPost.slug;

        toast({
          title: "Success",
          description: publish ? "Post published successfully" : "Post saved as draft",
        });
      }

      // Send notifications if newly published
      if (publish && wasUnpublished) {
        try {
          await fetch("/api/newsletter/notify-new-blog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              blog: {
                id: post?.id || "new",
                title: formData.title,
                slug: newPostSlug,
                excerpt: formData.excerpt,
                main_image_url: formData.main_image_url,
              },
            }),
          });
        } catch (notifyError) {
          console.error("Failed to send notifications:", notifyError);
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving post:", error);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {post?.id ? "Edit Post" : "Create New Post"}
          </h2>
          <p className="text-muted-foreground">
            Write and manage your blog content with Markdown support
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {post?.published ? "Update & Publish" : "Publish"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter post title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-friendly-post-title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Brief description of the post (auto-generated if empty)"
                      rows={3}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="content">Content *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleContentImageUpload}
                          disabled={uploadingContent}
                          className="hidden"
                          id="content-image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('content-image-upload')?.click()}
                          disabled={uploadingContent}
                        >
                          {uploadingContent ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ImageIcon className="w-4 h-4 mr-2" />
                          )}
                          Insert Image
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      id="content"
                      ref={(el) => { contentTextareaRef[0] = el; }}
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your post content in Markdown...&#10;&#10;# Heading 1&#10;## Heading 2&#10;&#10;**Bold text** and *italic text*&#10;&#10;- List item 1&#10;- List item 2&#10;&#10;```javascript&#10;// Code block&#10;console.log('Hello World');&#10;```&#10;&#10;> Blockquote&#10;&#10;[Link text](https://example.com)&#10;&#10;![Image](url)"
                      rows={20}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Markdown supported. Use # for headings, ** for bold, * for italic, ` for code, ``` for code blocks. Click "Insert Image" to upload and add images.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Featured Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    {imagePreview ? (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={imagePreview}
                          alt={formData.main_image_alt || "Preview"}
                          fill
                          className="object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, main_image_url: "" }));
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No image uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="image-upload">Upload Image</Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading && (
                      <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="image-alt">Image Alt Text</Label>
                    <Input
                      id="image-alt"
                      value={formData.main_image_alt}
                      onChange={(e) => setFormData(prev => ({ ...prev, main_image_alt: e.target.value }))}
                      placeholder="Describe the image for accessibility"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Categories & Author</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Select
                      value={formData.blog_author_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, blog_author_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select author" />
                      </SelectTrigger>
                      <SelectContent>
                        {authors.map((author) => (
                          <SelectItem key={author.id} value={author.id}>
                            {author.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag}>
                      Add
                    </Button>
                  </div>

                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer">
                          {tag}
                          <X
                            className="w-3 h-3 ml-1"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="featured">Featured Post</Label>
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="published">Published</Label>
                    <Switch
                      id="published"
                      checked={formData.published}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="meta-title">Meta Title</Label>
                    <Input
                      id="meta-title"
                      value={formData.meta_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                      placeholder="SEO title (defaults to post title)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="meta-description">Meta Description</Label>
                    <Textarea
                      id="meta-description"
                      value={formData.meta_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="SEO description (defaults to excerpt)"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                This is how your post will appear on the frontend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-4xl mx-auto">
                <article className="prose prose-gray dark:prose-invert max-w-none">
                  {imagePreview && (
                    <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8">
                      <Image
                        src={imagePreview}
                        alt={formData.main_image_alt || formData.title}
                        width={800}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <h1 className="text-4xl font-bold mb-4">
                    {formData.title || "Post Title"}
                  </h1>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                    {formData.blog_author_id && (
                      <span>
                        By {authors.find(a => a.id === formData.blog_author_id)?.name || "Unknown Author"}
                      </span>
                    )}
                    {formData.read_time && (
                      <span>{formData.read_time} min read</span>
                    )}
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>

                  {formData.excerpt && (
                    <div className="text-lg text-muted-foreground mb-8 italic">
                      {formData.excerpt}
                    </div>
                  )}

                  <div className="prose-content">
                    {formData.content ? (
                      <RichMarkdown content={formData.content} />
                    ) : (
                      <p className="text-muted-foreground">Start writing to see the preview...</p>
                    )}
                  </div>

                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </article>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
