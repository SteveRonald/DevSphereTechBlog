"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Eye, Upload, X, Star } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { RichMarkdown } from "@/components/RichMarkdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Review {
  id?: string;
  title: string;
  slug?: string;
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
}

interface ReviewFormProps {
  review?: Review | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewForm({ review, onClose, onSuccess }: ReviewFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("edit");
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [formData, setFormData] = useState<Review>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    content_type: "markdown",
    main_image_url: "",
    main_image_alt: "",
    author_id: "",
    category_id: "",
    product_name: "",
    product_url: "",
    rating: 5,
    pros: "",
    cons: "",
    featured: false,
    published: false,
    read_time: 5,
    meta_title: "",
    meta_description: "",
    tags: [],
  });

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
  }, []);

  useEffect(() => {
    if (review) {
      setFormData({
        ...review,
        tags: review.tags || [],
      });
    }
  }, [review]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/blog/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingImage(true);
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `reviews/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("course-assets")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("course-assets")
        .getPublicUrl(filePath);
      
      const publicUrl = data.publicUrl;

      setFormData(prev => ({
        ...prev,
        main_image_url: publicUrl,
      }));

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
      setUploadingImage(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  const handleSave = async (publish: boolean = false) => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.product_name.trim()) {
      toast({
        title: "Error",
        description: "Title, content, and product name are required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug) {
      formData.slug = generateSlug(formData.title);
    }

    try {
      setLoading(true);

      const reviewData = {
        ...formData,
        category_id: formData.category_id || null,
        author_id: formData.author_id || null,
        published: publish,
      };

      const url = review?.id
        ? `/api/admin/reviews/${review.id}`
        : "/api/admin/reviews";

      const method = review?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save review");
      }

      toast({
        title: "Success",
        description: publish ? "Review published successfully" : "Review saved as draft",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error saving review:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save review",
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
            {review?.id ? "Edit Review" : "Create New Review"}
          </h2>
          <p className="text-muted-foreground">
            Product review with Markdown support
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
            {review?.published ? "Update & Publish" : "Publish"}
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
                    <Label htmlFor="title">Review Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g., React 18 - A Comprehensive Review"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-friendly-slug"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="product_name">Product Name *</Label>
                      <Input
                        id="product_name"
                        value={formData.product_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                        placeholder="e.g., React 18"
                      />
                    </div>

                    <div>
                      <Label htmlFor="product_url">Product URL</Label>
                      <Input
                        id="product_url"
                        type="url"
                        value={formData.product_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, product_url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="rating"
                        type="number"
                        min="1"
                        max="5"
                        step="0.5"
                        value={formData.rating}
                        onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                        className="w-24"
                      />
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= (formData.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Brief summary of the review..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Review Content * (Markdown)</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your detailed review in Markdown..."
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pros">Pros (Markdown)</Label>
                    <Textarea
                      id="pros"
                      value={formData.pros}
                      onChange={(e) => setFormData(prev => ({ ...prev, pros: e.target.value }))}
                      placeholder="- Easy to learn&#10;- Great documentation&#10;- Active community"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cons">Cons (Markdown)</Label>
                    <Textarea
                      id="cons"
                      value={formData.cons}
                      onChange={(e) => setFormData(prev => ({ ...prev, cons: e.target.value }))}
                      placeholder="- Steep learning curve&#10;- Limited resources"
                      rows={6}
                      className="font-mono text-sm"
                    />
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
                  {formData.main_image_url && (
                    <div className="relative">
                      <img
                        src={formData.main_image_url}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, main_image_url: "" }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="image-upload">Upload Image</Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image-url">Or Image URL</Label>
                    <Input
                      id="image-url"
                      type="url"
                      value={formData.main_image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, main_image_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="image-alt">Alt Text</Label>
                    <Input
                      id="image-alt"
                      value={formData.main_image_alt}
                      onChange={(e) => setFormData(prev => ({ ...prev, main_image_alt: e.target.value }))}
                      placeholder="Image description"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
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
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Select
                      value={formData.author_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, author_id: value }))}
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

                  <div>
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                        placeholder="Add tag"
                      />
                      <Button type="button" onClick={addTag}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                          <X
                            className="w-3 h-3 ml-1 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="featured">Featured Review</Label>
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
                      placeholder="SEO title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="meta-description">Meta Description</Label>
                    <Textarea
                      id="meta-description"
                      value={formData.meta_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="SEO description"
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
            </CardHeader>
            <CardContent>
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h1 className="text-4xl font-bold mb-4">
                    {formData.title || "Review Title"}
                  </h1>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= (formData.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-lg font-semibold">
                        {formData.rating}/5
                      </span>
                    </div>
                    {formData.featured && (
                      <Badge variant="default">Featured</Badge>
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground mb-6">
                    {formData.product_name}
                  </p>
                </div>

                {formData.main_image_url && (
                  <img
                    src={formData.main_image_url}
                    alt={formData.main_image_alt || formData.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                )}

                <div>
                  <h2 className="text-2xl font-bold mb-4">Review</h2>
                  {formData.content ? (
                    <RichMarkdown content={formData.content} />
                  ) : (
                    <p className="text-muted-foreground">Start writing to see the preview...</p>
                  )}
                </div>

                {formData.pros && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-green-600">Pros</h2>
                    <RichMarkdown content={formData.pros} />
                  </div>
                )}

                {formData.cons && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Cons</h2>
                    <RichMarkdown content={formData.cons} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
