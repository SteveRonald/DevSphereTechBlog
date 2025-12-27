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
import { Loader2, X, Plus, GripVertical, Edit, Trash2, ArrowUp, ArrowDown, Save, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { LessonContentEditor } from "./LessonContentEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAutosave } from "@/hooks/use-autosave";

interface Lesson {
  id?: string;
  course_id: string;
  step_number: number;
  title: string;
  description?: string;
  content_type: string;
  content?: any;
  video_url?: string;
  duration?: number;
  is_preview: boolean;
  is_published: boolean;
}

interface LessonManagerProps {
  course: { id: string; title: string; is_published: boolean };
  onClose: () => void;
  onSuccess: () => void;
}

export function LessonManager({ course, onClose, onSuccess }: LessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState<string | null>(null);
  const [draggingLessonId, setDraggingLessonId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Lesson>({
    course_id: course.id,
    step_number: 1,
    title: "",
    description: "",
    content_type: "text",
    content: {},
    video_url: "",
    duration: 0,
    is_preview: false,
    is_published: course.is_published,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);

  // Autosave functionality
  const autosaveKey = `lesson_${course.id}_${editingLesson?.id || "new"}`;
  const { loadAutosaved, clearAutosave, forceSave } = useAutosave({
    data: formData,
    key: autosaveKey,
    interval: 1000, // Save every 1 second (faster)
    enabled: showForm, // Always enabled when form is open
    onSave: () => {
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    },
  });

  useEffect(() => {
    fetchLessons();
  }, [course.id]);

  const fetchLessons = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        `/api/lessons?course_id=${course.id}&include_drafts=true`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch lessons");
      }
      setLessons(data.lessons || []);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const persistOrder = async (ordered: Lesson[]) => {
    if (ordered.length === 0) return;
    setReordering(draggingLessonId || ordered[0]?.id || null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) throw new Error("Unauthorized");

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      };

      // Two-phase update to avoid step_number collisions.
      const baseTemp = 100000;

      for (let i = 0; i < ordered.length; i++) {
        const l = ordered[i];
        if (!l.id) continue;
        const res = await fetch(`/api/lessons/${l.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ step_number: baseTemp + i }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || "Failed to reorder lessons");
        }
      }

      for (let i = 0; i < ordered.length; i++) {
        const l = ordered[i];
        if (!l.id) continue;
        const res = await fetch(`/api/lessons/${l.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ step_number: i + 1 }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || "Failed to reorder lessons");
        }
      }

      toast({
        title: "Reordered",
        description: "Lesson order updated.",
      });

      await fetchLessons();
    } catch (error: any) {
      toast({
        title: "Reorder failed",
        description: error?.message || "Could not reorder lessons.",
        variant: "destructive",
      });
    } finally {
      setReordering(null);
      setDraggingLessonId(null);
    }
  };

  const reorderByDrag = async (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId) return;
    if (sourceId === targetId) return;
    const ordered = [...lessons].sort((a, b) => a.step_number - b.step_number);
    const from = ordered.findIndex((l) => l.id === sourceId);
    const to = ordered.findIndex((l) => l.id === targetId);
    if (from < 0 || to < 0) return;

    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    await persistOrder(next);
  };

  const swapLessonSteps = async (a: Lesson, b: Lesson) => {
    setReordering(a.id || null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Unauthorized");
      }

      // Use a temporary step number that will not collide.
      const tempStep = 999999;

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      };

      // 1) Move A to temp
      let res = await fetch(`/api/lessons/${a.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ step_number: tempStep }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to reorder lesson");
      }

      // 2) Move B to A's original step
      res = await fetch(`/api/lessons/${b.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ step_number: a.step_number }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to reorder lesson");
      }

      // 3) Move A from temp to B's original step
      res = await fetch(`/api/lessons/${a.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ step_number: b.step_number }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to reorder lesson");
      }

      toast({
        title: "Reordered",
        description: "Lesson order updated.",
      });

      await fetchLessons();
    } catch (error: any) {
      toast({
        title: "Reorder failed",
        description: error?.message || "Could not reorder lessons.",
        variant: "destructive",
      });
    } finally {
      setReordering(null);
    }
  };

  const moveLesson = async (lesson: Lesson, direction: "up" | "down") => {
    const ordered = [...lessons].sort((x, y) => x.step_number - y.step_number);
    const index = ordered.findIndex((l) => l.id === lesson.id);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      await swapLessonSteps(ordered[index], ordered[index - 1]);
    }
    if (direction === "down" && index < ordered.length - 1) {
      await swapLessonSteps(ordered[index], ordered[index + 1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Force save before submission to ensure latest data is saved
    if (showForm) {
      forceSave();
    }
    
    setSaving(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const url = editingLesson?.id
        ? `/api/lessons/${editingLesson.id}`
        : "/api/lessons";
      const method = editingLesson?.id ? "PUT" : "POST";

      // Auto-calculate step number if not set
      if (!editingLesson?.id) {
        const maxStep = lessons.length > 0
          ? Math.max(...lessons.map(l => l.step_number))
          : 0;
        formData.step_number = maxStep + 1;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          is_published: course.is_published,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save lesson");
      }

      toast({
        title: "Success",
        description:
          course.is_published
            ? editingLesson?.id
              ? "Lesson updated"
              : "Lesson created"
            : editingLesson?.id
            ? "Lesson saved to course draft"
            : "Lesson added to course draft",
      });

      // Clear autosave after successful save
      clearAutosave();
      setHasUnsavedChanges(false);
      setLastSaved(null);

      fetchLessons();
      setShowForm(false);
      setEditingLesson(null);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save lesson",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    setLessonToDelete(lessonId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!lessonToDelete) return;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/lessons/${lessonToDelete}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete lesson");
      }

      toast({
        title: "Success",
        description: "Lesson deleted",
      });

      fetchLessons();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lesson",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: course.id,
      step_number: lessons.length + 1,
      title: "",
      description: "",
      content_type: "text",
      content: {},
      video_url: "",
      duration: 0,
      is_preview: false,
      is_published: course.is_published,
    });
  };

  // Load autosaved data when form opens - only show once per session
  useEffect(() => {
    if (showForm && !editingLesson) {
      const autosaved = loadAutosaved();
      if (autosaved && (autosaved.title || Object.keys(autosaved.content || {}).length > 0)) {
        // Check if user has already dismissed this in this session
        const dismissedKey = `autosave_dismissed_${autosaveKey}`;
        const wasDismissed = sessionStorage.getItem(dismissedKey);
        
        if (!wasDismissed) {
          setShowRestoreDialog(true);
        }
      }
    }
  }, [showForm, editingLesson, autosaveKey]);

  const startEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData(lesson);
    setShowForm(true);
    setHasUnsavedChanges(false);
    setLastSaved(null);
  };

  const startCreate = () => {
    setEditingLesson(null);
    resetForm();
    setShowForm(true);
    setHasUnsavedChanges(false);
    setLastSaved(null);
  };

  const handleFormDataChange = (updates: Partial<Lesson>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...updates };
      setHasUnsavedChanges(true);
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <Card className="w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b flex-shrink-0 p-4 sm:p-6">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl truncate">Manage Lessons: {course.title}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Add, edit, and organize course lessons</CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={startCreate} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Lesson</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading lessons...</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No lessons yet</p>
              <Button onClick={startCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Lesson
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {[...lessons]
                .sort((a, b) => a.step_number - b.step_number)
                .map((lesson) => (
                <Card
                  key={lesson.id}
                  className={cn(
                    "group hover:border-primary/50 transition-colors",
                    draggingLessonId === lesson.id ? "opacity-70" : ""
                  )}
                  draggable
                  onDragStart={(e) => {
                    if (!lesson.id) return;
                    setDraggingLessonId(lesson.id);
                    e.dataTransfer.setData("text/plain", lesson.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    if (!lesson.id) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const sourceId = e.dataTransfer.getData("text/plain");
                    if (!lesson.id) return;
                    void reorderByDrag(sourceId, lesson.id);
                  }}
                  onDragEnd={() => setDraggingLessonId(null)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                        <div className="flex-shrink-0 pt-1">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">Module {lesson.step_number}</Badge>
                            <Badge variant="outline" className="text-xs capitalize">{lesson.content_type}</Badge>
                            {lesson.content_type === "quiz" && (lesson as any)?.content?.quiz_data?.assessment_type === "final_exam" ? (
                              <Badge className="bg-primary/10 text-primary text-xs" variant="outline">
                                Final Exam
                              </Badge>
                            ) : null}
                            {lesson.is_preview && (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 text-xs">
                                Preview
                              </Badge>
                            )}
                            {!lesson.is_published && (
                              <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                                Draft
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold mb-1 text-sm sm:text-base truncate">{lesson.title}</h3>
                          {lesson.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                              {lesson.description}
                            </p>
                          )}
                          {lesson.duration && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {lesson.duration} minutes
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto justify-end sm:justify-start">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveLesson(lesson, "up")}
                          disabled={reordering === lesson.id || lesson.step_number === Math.min(...lessons.map((l) => l.step_number))}
                          title="Move up"
                          className="h-8 w-8 p-0"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveLesson(lesson, "down")}
                          disabled={reordering === lesson.id || lesson.step_number === Math.max(...lessons.map((l) => l.step_number))}
                          title="Move down"
                          className="h-8 w-8 p-0"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(lesson)}
                          className="h-8 w-8 p-0"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(lesson.id!)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lesson Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 border-b flex-shrink-0">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl truncate">
                  {editingLesson ? "Edit Lesson" : "Create New Lesson"}
                </CardTitle>
                {hasUnsavedChanges && (
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
                    setPendingCloseAction(() => {
                      setShowForm(false);
                      setEditingLesson(null);
                      resetForm();
                    });
                    setShowCloseDialog(true);
                    return;
                  }
                  setShowForm(false);
                  setEditingLesson(null);
                  resetForm();
                }}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="step_number">Module Number *</Label>
                    <Input
                      id="step_number"
                      type="number"
                      value={formData.step_number}
                      onChange={(e) =>
                        handleFormDataChange({ step_number: parseInt(e.target.value) || 1 })
                      }
                      required
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content_type">Content Type *</Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(value) =>
                        handleFormDataChange({ content_type: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="resource">Resource</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Lesson Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFormDataChange({ title: e.target.value })}
                    required
                    placeholder="e.g., Introduction to React"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => handleFormDataChange({ description: e.target.value })}
                    placeholder="Brief description of this lesson"
                    rows={3}
                  />
                </div>

                {formData.content_type === "video" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="video_url">Video URL (Optional)</Label>
                      <Input
                        id="video_url"
                        type="url"
                        value={formData.video_url || ""}
                        onChange={(e) => handleFormDataChange({ video_url: e.target.value })}
                        placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Provide a video URL (YouTube, Vimeo, or direct video link)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Or Upload Video File</Label>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          // Validate file size (500MB max)
                          if (file.size > 500 * 1024 * 1024) {
                            toast({
                              title: "Error",
                              description: "Video file size must be less than 500MB",
                              variant: "destructive",
                            });
                            return;
                          }
                          
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
                                Authorization: `Bearer ${session.access_token}`,
                              },
                              body: formData,
                            });
                            
                            const data = await response.json();
                            
                            if (!response.ok) {
                              throw new Error(data.error || "Failed to upload video");
                            }
                            
                            handleFormDataChange({ video_url: data.url });
                            toast({
                              title: "Success",
                              description: "Video uploaded successfully",
                            });
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message || "Failed to upload video",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload a video file (MP4, WebM, MOV, etc.) - Max 500MB
                      </p>
                    </div>
                  </div>
                )}

                {formData.content_type === "project" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Project Instructions</Label>
                      <LessonContentEditor
                        contentType="text"
                        content={formData.content || {}}
                        onChange={(content) => handleFormDataChange({ content })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Project PDF (Optional)</Label>
                      <Input
                        type="file"
                        accept="application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          // Validate file size (50MB max)
                          if (file.size > 50 * 1024 * 1024) {
                            toast({
                              title: "Error",
                              description: "PDF file size must be less than 50MB",
                              variant: "destructive",
                            });
                            return;
                          }
                          
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
                            
                            const formDataUpload = new FormData();
                            formDataUpload.append("file", file);
                            
                            const response = await fetch("/api/upload", {
                              method: "POST",
                              headers: {
                                Authorization: `Bearer ${session.access_token}`,
                              },
                              body: formDataUpload,
                            });
                            
                            const data = await response.json();
                            
                            if (!response.ok) {
                              throw new Error(data.error || "Failed to upload PDF");
                            }
                            
                            // Store PDF URL in content
                            const updatedContent = {
                              ...(formData.content || {}),
                              project_pdf_url: data.url,
                            };
                            handleFormDataChange({ content: updatedContent });
                            toast({
                              title: "Success",
                              description: "Project PDF uploaded successfully",
                            });
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message || "Failed to upload PDF",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload a PDF file containing the project requirements or template - Max 50MB
                      </p>
                      {formData.content?.project_pdf_url && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                          <FileText className="h-4 w-4" />
                          <a 
                            href={formData.content.project_pdf_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            View uploaded PDF
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(formData.content_type === "video" ||
                  formData.content_type === "text" ||
                  formData.content_type === "code" ||
                  formData.content_type === "quiz" ||
                  formData.content_type === "resource") && (
                  <div className="space-y-2">
                    <Label>
                      {formData.content_type === "video"
                        ? "Module Notes (Markdown/HTML)"
                        : "Lesson Content"}
                    </Label>
                    <LessonContentEditor
                      contentType={formData.content_type === "video" ? "text" : formData.content_type}
                      content={formData.content || {}}
                      onChange={(content) => handleFormDataChange({ content })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration || 0}
                      onChange={(e) =>
                        handleFormDataChange({ duration: parseInt(e.target.value) || 0 })
                      }
                      min="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      id="is_preview"
                      checked={formData.is_preview}
                      onCheckedChange={(checked) =>
                        handleFormDataChange({ is_preview: checked })
                      }
                    />
                    <Label htmlFor="is_preview" className="text-sm">Preview (free access)</Label>
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
                          setShowForm(false);
                          setEditingLesson(null);
                          resetForm();
                        });
                        setShowCloseDialog(true);
                        return;
                      }
                      setShowForm(false);
                      setEditingLesson(null);
                      resetForm();
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Lesson
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

