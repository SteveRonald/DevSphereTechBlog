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
import { Loader2, X, Plus, GripVertical, Edit, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { LessonContentEditor } from "./LessonContentEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

interface LessonManagerProps {
  course: { id: string; title: string };
  onClose: () => void;
  onSuccess: () => void;
}

export function LessonManager({ course, onClose, onSuccess }: LessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
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
  });

  useEffect(() => {
    fetchLessons();
  }, [course.id]);

  const fetchLessons = async () => {
    try {
      const response = await fetch(`/api/lessons?course_id=${course.id}`);
      const data = await response.json();
      setLessons(data.lessons || []);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save lesson");
      }

      toast({
        title: "Success",
        description: editingLesson?.id ? "Lesson updated" : "Lesson created",
      });

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
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/lessons/${lessonId}`, {
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
    });
  };

  const startEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData(lesson);
    setShowForm(true);
  };

  const startCreate = () => {
    setEditingLesson(null);
    resetForm();
    setShowForm(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle>Manage Lessons: {course.title}</CardTitle>
            <CardDescription>Add, edit, and organize course lessons</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={startCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
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
              {lessons.map((lesson) => (
                <Card key={lesson.id} className="group hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 pt-1">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Step {lesson.step_number}</Badge>
                          <Badge variant="outline">{lesson.content_type}</Badge>
                          {lesson.is_preview && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                              Preview
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold mb-1">{lesson.title}</h3>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {lesson.description}
                          </p>
                        )}
                        {lesson.duration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {lesson.duration} minutes
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(lesson)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(lesson.id!)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingLesson ? "Edit Lesson" : "Create New Lesson"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => {
                setShowForm(false);
                setEditingLesson(null);
                resetForm();
              }}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="step_number">Step Number *</Label>
                    <Input
                      id="step_number"
                      type="number"
                      value={formData.step_number}
                      onChange={(e) =>
                        setFormData({ ...formData, step_number: parseInt(e.target.value) || 1 })
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
                        setFormData({ ...formData, content_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="resource">Resource</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Lesson Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Introduction to React"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this lesson"
                    rows={3}
                  />
                </div>

                {formData.content_type === "video" && (
                  <div className="space-y-2">
                    <Label htmlFor="video_url">Video URL</Label>
                    <Input
                      id="video_url"
                      type="url"
                      value={formData.video_url || ""}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Supports YouTube, Vimeo, and other video platforms
                    </p>
                  </div>
                )}

                {(formData.content_type === "text" || formData.content_type === "code" || formData.content_type === "quiz") && (
                  <div className="space-y-2">
                    <Label>Lesson Content</Label>
                    <LessonContentEditor
                      contentType={formData.content_type}
                      content={formData.content || {}}
                      onChange={(content) => setFormData({ ...formData, content })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                      }
                      min="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      id="is_preview"
                      checked={formData.is_preview}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_preview: checked })
                      }
                    />
                    <Label htmlFor="is_preview">Preview (free access)</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingLesson(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingLesson ? "Update Lesson" : "Create Lesson"}
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

