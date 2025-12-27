"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Submission = {
  id: string;
  status: "pending_review" | "approved" | "rejected";
  submission_text?: string | null;
  submission_url?: string | null;
  attachment_urls?: string[];
  feedback?: string | null;
  created_at?: string;
  updated_at?: string;
};

export function ProjectSubmission({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`/api/project-submissions?lesson_id=${encodeURIComponent(lessonId)}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load submission");
      }

      const s = (data?.submission || null) as Submission | null;
      setSubmission(s);
      setText(s?.submission_text || "");
      setUrl(s?.submission_url || "");
      setAttachmentUrls(Array.isArray((s as any)?.attachment_urls) ? (s as any).attachment_urls : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const fd = new FormData();
      fd.append("file", file);
      fd.append("lesson_id", lessonId);
      fd.append("purpose", "project_answer");

      const res = await fetch("/api/student-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      const url = typeof data?.url === "string" ? data.url : "";
      if (!url) throw new Error("Upload failed");

      setAttachmentUrls((prev) => Array.from(new Set([...prev, url])).slice(0, 10));
      toast({ title: "Uploaded", description: "File attached." });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Could not upload file", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const submit = async () => {
    try {
      const submissionText = text.trim();
      const submissionUrl = url.trim();

      if (!submissionText && !submissionUrl) {
        toast({ title: "Missing submission", description: "Provide text or a URL.", variant: "destructive" });
        return;
      }

      setSaving(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`/api/project-submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: lessonId,
          submission_text: submissionText,
          submission_url: submissionUrl,
          attachment_urls: attachmentUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit project");
      }

      setSubmission(data?.submission || null);
      toast({ title: "Submitted", description: "Your project was submitted for review." });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to submit", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Project Submission</CardTitle>
          {submission?.status ? <Badge variant="outline">{submission.status}</Badge> : null}
        </div>

        <div className="rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Attachments (optional)</div>
              <div className="text-xs text-muted-foreground">PDF/PNG/JPG/ZIP up to 10MB</div>
            </div>
            <label className="inline-flex">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.zip"
                disabled={uploading || saving}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void uploadFile(f);
                }}
              />
              <Button type="button" variant="outline" disabled={uploading || saving}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </label>
          </div>

          {attachmentUrls.length > 0 ? (
            <div className="mt-3 space-y-1">
              {attachmentUrls.map((u) => (
                <div key={u} className="flex items-center justify-between gap-2">
                  <a href={u} target="_blank" rel="noreferrer" className="text-xs underline truncate">
                    {u}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachmentUrls((prev) => prev.filter((x) => x !== u))}
                    disabled={uploading || saving}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : null}

        {submission?.feedback ? (
          <div className="rounded-md border border-border p-3 text-sm">
            <div className="font-medium">Instructor feedback</div>
            <div className="text-muted-foreground whitespace-pre-wrap">{submission.feedback}</div>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="text-sm font-medium">Submission URL (optional)</div>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/username/repo or live demo link"
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Submission details (optional)</div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your project, how to run it, and what you built..."
            rows={8}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={saving}>
            Refresh
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for Review"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
