"use client";

import { useState, useEffect, useRef } from "react";
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
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

interface Course {
  id?: string;
  title: string;
  slug?: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_duration: number;
  category: string;
  is_published: boolean;
}

interface CourseFormProps {
  course?: Course | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CourseForm({ course, onClose, onSuccess }: CourseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(course?.thumbnail_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Course>({
    title: "",
    description: "",
    short_description: "",
    thumbnail_url: "",
    difficulty_level: "beginner",
    estimated_duration: 0,
    category: "",
    is_published: false,
    ...course,
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to upload files",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      setFormData((prev) => ({ ...prev, thumbnail_url: data.url }));
      setThumbnailPreview(data.url);
      
      toast({
        title: "Success",
        description: "Thumbnail uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload thumbnail",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      handleFileUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create courses",
          variant: "destructive",
        });
        return;
      }

      const url = course?.id
        ? `/api/courses/${course.id}`
        : "/api/courses/create";
      const method = course?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save course");
      }

      toast({
        title: "Success",
        description: course?.id ? "Course updated successfully" : "Course created successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{course?.id ? "Edit Course" : "Create New Course"}</CardTitle>
            <CardDescription>
              {course?.id ? "Update course details" : "Fill in the details to create a new course"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Complete React Mastery"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description *</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                required
                placeholder="Brief description (max 500 characters)"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Detailed course description"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty_level">Difficulty Level *</Label>
                <Select
                  value={formData.difficulty_level}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, difficulty_level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_duration">Duration (minutes) *</Label>
                <Input
                  id="estimated_duration"
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) =>
                    setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })
                  }
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                placeholder="e.g., Web Development, AI & ML"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Course Thumbnail</Label>
              <div className="space-y-4">
                {thumbnailPreview && (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                    <Image
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setThumbnailPreview(null);
                        setFormData({ ...formData, thumbnail_url: "" });
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Input
                    ref={fileInputRef}
                    id="thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {thumbnailPreview ? "Change Thumbnail" : "Upload Thumbnail"}
                      </>
                    )}
                  </Button>
                  {thumbnailPreview && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      Image uploaded
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 1280x720px, max 5MB. Supported formats: JPG, PNG, WebP, GIF
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_published: checked })
                }
              />
              <Label htmlFor="is_published">Publish course</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {course?.id ? "Update Course" : "Create Course"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

