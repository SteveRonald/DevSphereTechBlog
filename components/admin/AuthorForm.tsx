"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X, Upload, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

interface Author {
  id?: string;
  name: string;
  slug?: string;
  bio?: string;
  bio_html?: string;
  image_url?: string;
  role?: string;
  email?: string;
  website?: string;
  twitter_url?: string;
  github_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  instagram_url?: string;
  active: boolean;
}

interface AuthorFormProps {
  author?: Author | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthorForm({ author, onClose, onSuccess }: AuthorFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(author?.image_url || null);

  const [formData, setFormData] = useState<Author>({
    name: "",
    slug: "",
    bio: "",
    bio_html: "",
    image_url: "",
    role: "",
    email: "",
    website: "",
    twitter_url: "",
    github_url: "",
    linkedin_url: "",
    youtube_url: "",
    instagram_url: "",
    active: true,
    ...author,
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
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
      const fileName = `authors/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      setImagePreview(publicUrl);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug) {
      formData.slug = generateSlug(formData.name);
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const authorData = {
        ...formData,
        created_by: user?.id,
        updated_by: user?.id,
      };

      if (author?.id) {
        const { error } = await supabase
          .from("blog_authors")
          .update(authorData)
          .eq("id", author.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Author updated successfully",
        });
      } else {
        const { error } = await supabase.from("blog_authors").insert([authorData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Author created successfully",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving author:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save author",
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
            <CardTitle>{author ? "Edit Author" : "Create New Author"}</CardTitle>
            <CardDescription>
              {author ? "Update author information" : "Add a new author to your blog"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="john-doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role/Title</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Senior Developer, Content Writer, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="author@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief biography about the author"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio_html">Bio (HTML)</Label>
              <Textarea
                id="bio_html"
                value={formData.bio_html}
                onChange={(e) => setFormData({ ...formData, bio_html: e.target.value })}
                placeholder="Rich text biography (HTML format)"
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Profile Image */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profile Image</h3>

            <div className="space-y-2">
              <Label>Author Photo</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative h-24 w-24 rounded-full overflow-hidden">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  {uploading && (
                    <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Social Links</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_url">Twitter/X</Label>
                <Input
                  id="twitter_url"
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github_url">GitHub</Label>
                <Input
                  id="github_url"
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  placeholder="https://github.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_url">YouTube</Label>
                <Input
                  id="youtube_url"
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/@username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram</Label>
                <Input
                  id="instagram_url"
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/username"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="active">Active</Label>
              <p className="text-sm text-muted-foreground">
                Inactive authors won't appear in author selection dropdowns
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {author ? "Update Author" : "Create Author"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}




