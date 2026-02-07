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
import { Loader2, Edit, Eye, Briefcase, MapPin, Clock, DollarSign, Calendar, Upload, X, Image as ImageIcon } from "lucide-react";
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

interface Career {
  id?: string;
  title: string;
  slug?: string;
  company: string;
  location: string;
  job_type: string;
  salary_range?: string;
  thumbnail_url?: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits?: string;
  application_url?: string;
  application_email?: string;
  application_deadline?: string;
  featured: boolean;
  published: boolean;
}

interface CareerFormProps {
  career?: Career | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CareerForm({ career, onClose, onSuccess }: CareerFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(career?.thumbnail_url || null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("edit");

  const [formData, setFormData] = useState<Career>({
    title: "",
    slug: "",
    company: "",
    location: "",
    job_type: "Full-time",
    salary_range: "",
    thumbnail_url: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    application_url: "",
    application_email: "",
    application_deadline: "",
    featured: false,
    published: false,
  });

  useEffect(() => {
    if (career) {
      setFormData({
        ...career,
        salary_range: career.salary_range || "",
        thumbnail_url: career.thumbnail_url || "",
        benefits: career.benefits || "",
        application_url: career.application_url || "",
        application_email: career.application_email || "",
        application_deadline: career.application_deadline || "",
      });
      setImagePreview(career.thumbnail_url || null);
    }
  }, [career]);

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
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `career-thumbnails/${fileName}`;

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
        thumbnail_url: data.publicUrl,
      }));
      setImagePreview(data.publicUrl);
      
      toast({
        title: "Success",
        description: "Thumbnail uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error uploading thumbnail:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload thumbnail",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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

    if (!formData.company.trim() || !formData.location.trim()) {
      toast({
        title: "Error",
        description: "Company and location are required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim() || !formData.responsibilities.trim()) {
      toast({
        title: "Error",
        description: "Excerpt and content are required",
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

      const careerData = {
        ...formData,
        // Use a single content field in the form; keep requirements empty for compatibility.
        requirements: formData.requirements || "",
        published: publish,
        created_by: user?.id,
        updated_by: user?.id,
      };

      const wasUnpublished = !career?.published;
      let newCareerSlug = formData.slug;

      if (career?.id) {
        const { error } = await supabase
          .from("career_listings")
          .update(careerData)
          .eq("id", career.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: publish ? "Career listing published successfully" : "Career listing saved as draft",
        });
      } else {
        const { data: newCareer, error } = await supabase
          .from("career_listings")
          .insert([careerData])
          .select()
          .single();

        if (error) throw error;
        if (newCareer) newCareerSlug = newCareer.slug;

        toast({
          title: "Success",
          description: publish ? "Career listing published successfully" : "Career listing saved as draft",
        });
      }

      // Send notifications if newly published
      if (publish && wasUnpublished) {
        try {
          await fetch("/api/newsletter/notify-new-career", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              career: {
                id: career?.id || "new",
                title: formData.title,
                slug: newCareerSlug,
                company: formData.company,
                location: formData.location,
                job_type: formData.job_type,
                description: formData.description,
                thumbnail_url: formData.thumbnail_url,
              },
            }),
          });
        } catch (notifyError) {
          console.error("Failed to send notifications:", notifyError);
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving career listing:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save career listing",
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
            {career?.id ? "Edit Career Listing" : "Create New Career Listing"}
          </h2>
          <p className="text-muted-foreground">
            Manage career opportunities with Markdown support
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
            {career?.published ? "Update & Publish" : "Publish"}
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
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g., Senior Full Stack Developer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-friendly-job-title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company *</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Company name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., Remote, New York, NY"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="job_type">Job Type *</Label>
                      <Select
                        value={formData.job_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, job_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="salary_range">Salary Range</Label>
                      <Input
                        id="salary_range"
                        value={formData.salary_range}
                        onChange={(e) => setFormData(prev => ({ ...prev, salary_range: e.target.value }))}
                        placeholder="e.g., $80k - $120k"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Excerpt *</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Short summary shown in listings..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="responsibilities">Content * (Markdown)</Label>
                    <Textarea
                      id="responsibilities"
                      value={formData.responsibilities}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
                      placeholder="Write the full job content (role, responsibilities, requirements, etc.)"
                      rows={8}
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
                  <CardTitle>Thumbnail Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    {imagePreview ? (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={imagePreview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, thumbnail_url: "" }));
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No thumbnail uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="thumbnail-upload">Upload Thumbnail</Label>
                    <Input
                      id="thumbnail-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading && (
                      <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Application Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="application_url">Application URL</Label>
                    <Input
                      id="application_url"
                      type="url"
                      value={formData.application_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, application_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="application_email">Application Email</Label>
                    <Input
                      id="application_email"
                      type="email"
                      value={formData.application_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, application_email: e.target.value }))}
                      placeholder="careers@company.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="application_deadline">Application Deadline</Label>
                    <Input
                      id="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="featured">Featured Listing</Label>
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
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-5xl mx-auto space-y-6">
                {imagePreview && (
                  <div className="w-full h-64 rounded-lg overflow-hidden bg-muted mb-6">
                    <img
                      src={imagePreview}
                      alt="Career thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    {formData.featured && (
                      <Badge variant="default" className="bg-primary">Featured</Badge>
                    )}
                    <Badge variant="outline">{formData.job_type}</Badge>
                  </div>

                  <h1 className="text-4xl font-bold mb-4">
                    {formData.title || "Job Title"}
                  </h1>

                  <div className="flex items-center gap-2 mb-6">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-semibold">{formData.company || "Company Name"}</span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{formData.location || "Location"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{formData.job_type}</span>
                    </div>
                    {formData.salary_range && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>{formData.salary_range}</span>
                      </div>
                    )}
                    {formData.application_deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Apply by {formData.application_deadline}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Excerpt</h2>
                    {formData.description ? (
                      <p className="text-base leading-relaxed">{formData.description}</p>
                    ) : (
                      <p className="text-muted-foreground">Start writing to see the preview...</p>
                    )}
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold mb-4">Content</h2>
                    {formData.responsibilities ? (
                      <RichMarkdown content={formData.responsibilities} />
                    ) : (
                      <p className="text-muted-foreground">Start writing to see the preview...</p>
                    )}
                  </div>

                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
