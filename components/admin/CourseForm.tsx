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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, X, Upload, Image as ImageIcon, Save, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { useAutosave } from "@/hooks/use-autosave";

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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishOverride, setPublishOverride] = useState<boolean | null>(null);
  const [notifyUpdateOverride, setNotifyUpdateOverride] = useState<boolean | null>(null);
  const [activeAction, setActiveAction] = useState<'update' | 'save-draft' | 'publish' | 'unpublish' | null>(null);
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);

  // Autosave functionality
  const autosaveKey = `course_${course?.id || "new"}`;
  const { loadAutosaved, clearAutosave, forceSave } = useAutosave({
    data: formData,
    key: autosaveKey,
    interval: 1000, // Save every 1 second (faster)
    enabled: true, // Always enabled
    onSave: () => {
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    },
  });

  // Load autosaved data on mount - only show once per session
  useEffect(() => {
    if (!course?.id) {
      const autosaved = loadAutosaved();
      if (autosaved && (autosaved.title || autosaved.description)) {
        // Check if user has already dismissed this in this session
        const dismissedKey = `autosave_dismissed_${autosaveKey}`;
        const wasDismissed = sessionStorage.getItem(dismissedKey);
        
        if (!wasDismissed) {
          setShowRestoreDialog(true);
        }
      }
    }
  }, [course?.id, autosaveKey]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setStatusMessage("Uploading thumbnail...");
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

      handleFormDataChange({ thumbnail_url: data.url });
      setThumbnailPreview(data.url);
      
      setStatusMessage(null);
      toast({
        title: "Success",
        description: "Thumbnail uploaded successfully",
      });
    } catch (error: any) {
      setStatusMessage(null);
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

  const handleSubmit = async (
    e: React.FormEvent,
    options?: { overrideIsPublished?: boolean; notifyUpdate?: boolean; action?: 'update' | 'save-draft' | 'publish' | 'unpublish' }
  ) => {
    e.preventDefault();
    const action = course?.id ? "Updating" : "Creating";
    setStatusMessage(`${action} course...`);
    setLoading(true);
    setActiveAction(options?.action || null);

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

      // Force save before submission to ensure latest data is saved
      forceSave();

      const url = course?.id
        ? `/api/courses/${course.id}`
        : "/api/courses/create";
      const method = course?.id ? "PUT" : "POST";

      // Determine publish status
      let publishStatus = formData.is_published;
      if (typeof options?.overrideIsPublished === "boolean") {
        publishStatus = options.overrideIsPublished;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          is_published: publishStatus,
          ...(options?.notifyUpdate === true ? { notify_subscribers_about_update: true } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save course");
      }

      setStatusMessage(null);
      
      // Determine success message based on action
      let successMessage = "";
      if (course?.id) {
        // Existing course
        if (typeof options?.overrideIsPublished === "boolean") {
          if (options.overrideIsPublished) {
            successMessage = "Course published successfully";
          } else {
            successMessage = "Course unpublished successfully";
          }
        } else if (options?.overrideIsPublished === undefined) {
          // Update button - maintain current status
          successMessage = formData.is_published 
            ? "Course updated successfully" 
            : "Draft updated successfully";
        } else {
          successMessage = "Course saved to draft successfully";
        }
      } else {
        // New course
        if (typeof options?.overrideIsPublished === "boolean") {
          if (options.overrideIsPublished) {
            successMessage = "Course created and published successfully";
          } else {
            successMessage = "Course draft saved successfully";
          }
        } else {
          successMessage = "Course draft saved successfully";
        }
      }
      
      toast({
        title: "Success",
        description: successMessage,
      });

      // Clear autosave after successful save
      clearAutosave();
      setHasUnsavedChanges(false);
      setLastSaved(null);
      setActiveAction(null);

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
      setActiveAction(null);
    }
  };

  const handleFormDataChange = (updates: Partial<Course>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...updates };
      setHasUnsavedChanges(true);
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <Card className="w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 border-b flex-shrink-0">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl">
              {course?.id ? "Edit Course" : "Create New Course"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {course?.id ? "Update course details" : "Fill in the details to create a new course"}
            </CardDescription>
            {statusMessage && (
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {statusMessage}
              </p>
            )}
            {hasUnsavedChanges && !statusMessage && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                Unsaved changes
                {lastSaved && (
                  <span className="ml-2">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              // Force save before closing
              forceSave();
              
              if (hasUnsavedChanges) {
                setPendingCloseAction(() => onClose);
                setShowCloseDialog(true);
                return;
              }
              onClose();
            }}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form
            onSubmit={(e) => {
              const override = publishOverride;
              const notifyUpdate = notifyUpdateOverride;
              setPublishOverride(null);
              setNotifyUpdateOverride(null);
              void handleSubmit(e, {
                overrideIsPublished: typeof override === "boolean" ? override : undefined,
                notifyUpdate: notifyUpdate === true,
              });
            }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFormDataChange({ title: e.target.value })}
                required
                placeholder="e.g., Complete React Mastery"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description *</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => handleFormDataChange({ short_description: e.target.value })}
                required
                placeholder="Brief description (max 500 characters)"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.short_description.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormDataChange({ description: e.target.value })}
                required
                placeholder="Detailed course description"
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty_level">Difficulty Level *</Label>
                <Select
                  value={formData.difficulty_level}
                  onValueChange={(value: any) =>
                    handleFormDataChange({ difficulty_level: value })
                  }
                >
                  <SelectTrigger className="w-full">
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
                    handleFormDataChange({ estimated_duration: parseInt(e.target.value) || 0 })
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
                onChange={(e) => handleFormDataChange({ category: e.target.value })}
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
                        handleFormDataChange({ thumbnail_url: "" });
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
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
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

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  // Force save before closing
                  forceSave();
                  
                  if (hasUnsavedChanges) {
                    setPendingCloseAction(() => {
                      setStatusMessage("Canceling...");
                      onClose();
                    });
                    setShowCloseDialog(true);
                    return;
                  }
                  setStatusMessage("Canceling...");
                  onClose();
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              
              {/* Update Button - Show when editing existing course, maintains current publish status */}
              {course?.id && (
                <Button
                  type="submit"
                  variant="default"
                  disabled={loading && activeAction !== 'update'}
                  onClick={(e) => {
                    e.preventDefault();
                    setStatusMessage(formData.is_published ? "Updating course..." : "Updating draft...");
                    setNotifyUpdateOverride(null);
                    setPublishOverride(null); // Keep current publish status
                    handleSubmit(e, { 
                      overrideIsPublished: undefined, // Don't override, keep current status
                      notifyUpdate: false,
                      action: 'update'
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  {loading && activeAction === 'update' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update
                    </>
                  )}
                </Button>
              )}
              
              {/* Save to Draft Button */}
              <Button
                type="submit"
                variant="outline"
                disabled={loading && activeAction !== 'save-draft'}
                onClick={(e) => {
                  e.preventDefault();
                  setStatusMessage("Saving draft...");
                  setNotifyUpdateOverride(null);
                  setPublishOverride(false);
                  handleSubmit(e, { 
                    overrideIsPublished: false,
                    notifyUpdate: false,
                    action: 'save-draft'
                  });
                }}
                className="w-full sm:w-auto"
              >
                {loading && activeAction === 'save-draft' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save to Draft
                  </>
                )}
              </Button>

              {/* Publish Button - Show when course is not published */}
              {!formData.is_published && (
                <Button
                  type="submit"
                  variant="default"
                  disabled={loading && activeAction !== 'publish'}
                  onClick={(e) => {
                    e.preventDefault();
                    setStatusMessage(course?.id ? "Publishing course..." : "Creating and publishing course...");
                    setNotifyUpdateOverride(null);
                    setPublishOverride(true);
                    handleSubmit(e, { 
                      overrideIsPublished: true,
                      notifyUpdate: false,
                      action: 'publish'
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  {loading && activeAction === 'publish' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Publish
                    </>
                  )}
                </Button>
              )}

              {/* Unpublish Button - Show when course is published */}
              {formData.is_published && course?.id && (
                <Button
                  type="submit"
                  variant="outline"
                  disabled={loading && activeAction !== 'unpublish'}
                  onClick={(e) => {
                    e.preventDefault();
                    setStatusMessage("Unpublishing course...");
                    setNotifyUpdateOverride(null);
                    setPublishOverride(false);
                    handleSubmit(e, { 
                      overrideIsPublished: false,
                      notifyUpdate: false,
                      action: 'unpublish'
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  {loading && activeAction === 'unpublish' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Unpublishing...
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Unpublish
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Restore Autosave Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Unsaved Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              We found unsaved changes from a previous session. Would you like to restore them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                const dismissedKey = `autosave_dismissed_${autosaveKey}`;
                sessionStorage.setItem(dismissedKey, "true");
              }}
            >
              No, Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const autosaved = loadAutosaved();
                if (autosaved) {
                  setFormData(autosaved);
                  setHasUnsavedChanges(true);
                  if (autosaved.thumbnail_url) {
                    setThumbnailPreview(autosaved.thumbnail_url);
                  }
                  toast({
                    title: "Restored",
                    description: "Your unsaved changes have been restored.",
                  });
                }
              }}
            >
              Yes, Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close with Unsaved Changes Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close? Your changes are auto-saved and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingCloseAction) {
                  pendingCloseAction();
                  setPendingCloseAction(null);
                }
              }}
            >
              Close Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

