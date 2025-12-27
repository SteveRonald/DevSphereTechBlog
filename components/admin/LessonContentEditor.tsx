"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  X,
  Trash2,
  Upload,
  Link as LinkIcon,
  FileText,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Image as ImageIcon,
  Unlink,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  IndentIncrease,
  IndentDecrease,
  Highlighter,
  Paintbrush,
  Table2,
  Rows3,
  Columns3,
  Trash,
  Minus,
  Maximize2,
  Minimize2,
  MinusSquare,
  Loader2,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import TextAlignExtension from "@tiptap/extension-text-align";
import TextStyleExtension from "@tiptap/extension-text-style";
import FontFamilyExtension from "@tiptap/extension-font-family";
import ColorExtension from "@tiptap/extension-color";
import HighlightExtension from "@tiptap/extension-highlight";
import TableExtension from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { Extension } from "@tiptap/core";
import { createClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

interface LessonContentEditorProps {
  contentType: string;
  content: any;
  videoUrl?: string;
  onChange: (content: any, videoUrl?: string) => void;
}

interface ResourceItem {
  title: string;
  url: string;
  kind: "file" | "link";
  path?: string;
}

export function LessonContentEditor({
  contentType,
  content,
  videoUrl,
  onChange,
}: LessonContentEditorProps) {
  const [textContent, setTextContent] = useState(content?.text_content || "");
  const [activeTextTab, setActiveTextTab] = useState<"visual" | "html">("visual");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageActionRef = useRef<"insert" | "replace">("insert");
  const [fullscreen, setFullscreen] = useState(false);
  const [codeExamples, setCodeExamples] = useState<any[]>(content?.code_examples || []);
  const [quizData, setQuizData] = useState(
    content?.quiz_data
      ? {
          assessment_type: (content.quiz_data as any)?.assessment_type || "cat",
          ...content.quiz_data,
        }
      : {
          assessment_type: "cat",
          questions: [],
        }
  );
  const [resources, setResources] = useState<ResourceItem[]>(content?.resources || []);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const quizCsvInputRef = useRef<HTMLInputElement>(null);
  const [quizImportMode, setQuizImportMode] = useState<"append" | "replace">("append");
  const [showCsvConfirmDialog, setShowCsvConfirmDialog] = useState(false);
  const [pendingCsvFile, setPendingCsvFile] = useState<File | null>(null);

  const sanitizeHtml = (value: string) => {
    try {
      const doc = new DOMParser().parseFromString(value, "text/html");

      const blockedTags = new Set(["script", "style", "iframe", "object", "embed"]);
      blockedTags.forEach((tag) => {
        doc.querySelectorAll(tag).forEach((n) => n.remove());
      });

      doc.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const name = attr.name.toLowerCase();
          const val = attr.value;
          if (name.startsWith("on")) el.removeAttribute(attr.name);

          if ((name === "href" || name === "src") && /^\s*javascript:/i.test(val)) {
            el.removeAttribute(attr.name);
          }
        });

        if (el.tagName.toLowerCase() === "a") {
          el.setAttribute("rel", "noopener noreferrer");
          el.setAttribute("target", "_blank");
        }
      });

      return doc.body.innerHTML || "";
    } catch {
      return value;
    }
  };

  const handleTextChange = (value: string) => {
    const sanitized = sanitizeHtml(value);
    setTextContent(sanitized);
    onChange({ text_content: sanitized });
  };

  const FontSizeExtension = useMemo(
    () =>
      Extension.create({
        name: "fontSize",
        addGlobalAttributes() {
          return [
            {
              types: ["textStyle"],
              attributes: {
                fontSize: {
                  default: null,
                  parseHTML: (element) => (element as HTMLElement).style.fontSize || null,
                  renderHTML: (attributes) => {
                    if (!attributes.fontSize) return {};
                    return {
                      style: `font-size: ${attributes.fontSize}`,
                    };
                  },
                },
              },
            },
          ];
        },
        addCommands() {
          return {
            setFontSize:
              (fontSize: string | null) =>
              ({ chain }: { chain: any }) => {
                if (!fontSize) {
                  return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
                }
                return chain().setMark("textStyle", { fontSize }).run();
              },
          } as any;
        },
      }),
    []
  );

  const LineHeightExtension = useMemo(
    () =>
      Extension.create({
        name: "lineHeight",
        addGlobalAttributes() {
          return [
            {
              types: ["paragraph", "heading"],
              attributes: {
                lineHeight: {
                  default: null,
                  parseHTML: (element) => (element as HTMLElement).style.lineHeight || null,
                  renderHTML: (attributes) => {
                    if (!attributes.lineHeight) return {};
                    return {
                      style: `line-height: ${attributes.lineHeight}`,
                    };
                  },
                },
              },
            },
          ];
        },
        addCommands() {
          return {
            setLineHeight:
              (lineHeight: string | null) =>
              ({ chain }: { chain: any }) => {
                return chain().setNode("paragraph", { lineHeight }).run();
              },
          } as any;
        },
      }),
    []
  );

  const tiptapExtensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExtension,
      TextStyleExtension,
      FontFamilyExtension,
      FontSizeExtension,
      LineHeightExtension,
      ColorExtension,
      HighlightExtension.configure({ multicolor: true }),
      TextAlignExtension.configure({
        types: ["heading", "paragraph"],
      }),
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      LinkExtension.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      ImageExtension.configure({ inline: false }),
    ],
    []
  );

  const editor = useEditor({
    extensions: tiptapExtensions,
    content: textContent,
    editorProps: {
      attributes: {
        class:
          "min-h-[240px] rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring prose prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-h1:text-2xl prose-h1:font-bold prose-h2:text-xl prose-h2:font-semibold prose-h3:text-lg prose-h3:font-semibold prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-md prose-pre:p-4 prose-pre:border prose-pre:border-border prose-pre:overflow-x-auto prose-code:bg-muted prose-code:text-foreground prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-img:rounded-md prose-img:border prose-img:border-border",
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const fileItem = items.find((i) => i.kind === "file" && i.type.startsWith("image/"));
        const file = fileItem?.getAsFile();
        if (!file) return false;
        void (async () => {
          const url = await uploadInlineImage(file);
          if (!url) return;
          editor?.chain().focus().setImage({ src: url }).run();
        })();
        event.preventDefault();
        return true;
      },
      handleDrop: (_view, event) => {
        const dt = event.dataTransfer;
        const file = dt?.files?.[0];
        if (!file || !file.type.startsWith("image/")) return false;
        void (async () => {
          const url = await uploadInlineImage(file);
          if (!url) return;
          editor?.chain().focus().setImage({ src: url }).run();
        })();
        event.preventDefault();
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      handleTextChange(html);
    },
  });

  const uploadInlineImage = async (file: File): Promise<string | null> => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Not signed in",
          description: "Sign in as an admin to upload images.",
          variant: "destructive",
        });
        return null;
      }

      const fd = new FormData();
      fd.append("file", file);
      // Keep using existing upload route (image types allowed). Purpose is optional; default is thumbnail.

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to upload image");
      }

      return typeof data?.url === "string" ? data.url : null;
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: e?.message || "Failed to upload image.",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    if (contentType !== "text") return;
    if (!editor) return;
    if (activeTextTab !== "visual") return;
    // If HTML changed externally (e.g. switched to HTML tab and edited), keep TipTap in sync.
    const current = editor.getHTML();
    if (current !== textContent) {
      editor.commands.setContent(textContent || "", false);
    }
  }, [textContent, editor, activeTextTab, contentType]);

  const setHeading = (level: 1 | 2 | 3) => {
    editor?.chain().focus().toggleHeading({ level }).run();
  };

  const upsertLink = () => {
    if (!editor) return;
    const existing = editor.getAttributes("link")?.href || "";
    const url = window.prompt("Enter link URL", existing) || "";
    const trimmed = url.trim();
    if (!trimmed) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  const removeLink = () => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
  };

  const openImagePicker = () => {
    imageActionRef.current = "insert";
    imageInputRef.current?.click();
  };

  const openReplaceImagePicker = () => {
    imageActionRef.current = "replace";
    imageInputRef.current?.click();
  };

  const changeFontSizeBy = (deltaPx: number) => {
    if (!editor) return;
    const current = editor.getAttributes("textStyle")?.fontSize as string | undefined;
    const currentNum = current ? parseInt(String(current).replace(/px$/i, ""), 10) : 16;
    const safeCurrent = Number.isFinite(currentNum) ? currentNum : 16;
    const next = Math.min(72, Math.max(10, safeCurrent + deltaPx));
    editor.chain().focus().setFontSize(`${next}px`).run();
  };

  const setTextColor = (value: string) => {
    if (!editor) return;
    if (value === "default") {
      editor.chain().focus().unsetColor().run();
      return;
    }
    editor.chain().focus().setColor(value).run();
  };

  const setHighlightColor = (value: string) => {
    if (!editor) return;
    if (value === "none") {
      editor.chain().focus().unsetHighlight().run();
      return;
    }
    editor.chain().focus().toggleHighlight({ color: value }).run();
  };

  const setLineHeight = (value: string) => {
    if (!editor) return;
    const v = value === "default" ? null : value;
    editor.chain().focus().setLineHeight(v).run();
  };

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const clearFormatting = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .unsetAllMarks()
      .clearNodes()
      .run();

    editor.chain().focus().unsetColor().unsetHighlight().run();
  };

  const onImageFileSelected = async (file: File | null) => {
    if (!file || !editor) return;
    const url = await uploadInlineImage(file);
    if (!url) return;
    if (imageActionRef.current === "replace") {
      if (!editor.isActive("image")) {
        toast({
          title: "Select an image",
          description: "Click the image in the editor first, then click Replace image.",
          variant: "destructive",
        });
        return;
      }
      editor.chain().focus().updateAttributes("image", { src: url }).run();
      return;
    }
    editor.chain().focus().setImage({ src: url }).run();
  };

  const replaceSelectedImage = () => {
    if (!editor) return;
    if (!editor.isActive("image")) return;
    openReplaceImagePicker();
  };

  const removeSelectedImage = () => {
    if (!editor) return;
    if (!editor.isActive("image")) return;
    editor.chain().focus().deleteSelection().run();
  };

  const addCodeExample = () => {
    const newExample = {
      title: "",
      code: "",
      explanation: "",
      language: "javascript",
    };
    const updated = [...codeExamples, newExample];
    setCodeExamples(updated);
    onChange({ code_examples: updated });
  };

  const updateCodeExample = (index: number, field: string, value: string) => {
    const updated = [...codeExamples];
    updated[index] = { ...updated[index], [field]: value };
    setCodeExamples(updated);
    onChange({ code_examples: updated });
  };

  const removeCodeExample = (index: number) => {
    const updated = codeExamples.filter((_, i) => i !== index);
    setCodeExamples(updated);
    onChange({ code_examples: updated });
  };

  const addQuizQuestion = () => {
    const newQuestion = {
      question_type: "multiple_choice",
      question: "",
      options: ["", "", "", ""],
      correct_answer: 0,
      explanation: "",
      max_marks: 1,
    };
    const updated = {
      ...quizData,
      questions: [...quizData.questions, newQuestion],
    };
    setQuizData(updated);
    onChange({ ...(content || {}), quiz_data: updated });
  };

  const parseCsvRow = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out.map((v) => v.trim());
  };

  const toNumberOrNull = (value: any) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const s = String(value ?? "").trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const normalizeCorrectAnswer = (raw: any) => {
    const n = toNumberOrNull(raw);
    if (n === null) {
      const s = String(raw ?? "").trim();
      return s ? s : 0;
    }
    // Accept both 0-based and 1-based indices.
    if (Number.isInteger(n) && n >= 1 && n <= 50) return n - 1;
    return n;
  };

  const importQuizQuestionsFromCsv = (csvText: string) => {
    const text = String(csvText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    if (!text) {
      toast({ title: "No CSV", description: "Please select a CSV file with quiz questions.", variant: "destructive" });
      return;
    }

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      toast({ title: "Invalid CSV", description: "CSV must include a header row and at least one data row.", variant: "destructive" });
      return;
    }

    const header = parseCsvRow(lines[0]).map((h) => h.toLowerCase());
    const idx = (name: string) => header.indexOf(name);

    const required = ["question", "question_type"];
    const missing = required.filter((k) => idx(k) === -1);
    if (missing.length) {
      toast({
        title: "Missing columns",
        description: `CSV header must include: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    const questions: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvRow(lines[i]);
      const get = (key: string) => {
        const p = idx(key);
        if (p === -1) return "";
        return cols[p] ?? "";
      };

      const question_type = (get("question_type") || "multiple_choice").trim() as any;
      const question = String(get("question") || "").trim();
      if (!question) continue;

      const max_marks = Math.max(0, Math.floor(toNumberOrNull(get("max_marks")) ?? 1));
      const explanation = String(get("explanation") || "");

      if (question_type === "free_text") {
        questions.push({
          question_type: "free_text",
          question,
          explanation,
          max_marks,
        });
        continue;
      }

      // multiple_choice
      const optionsFromSingle = String(get("options") || "")
        .split("|")
        .map((o) => o.trim())
        .filter(Boolean);
      const option1 = String(get("option_1") || "");
      const option2 = String(get("option_2") || "");
      const option3 = String(get("option_3") || "");
      const option4 = String(get("option_4") || "");

      let options = optionsFromSingle.length ? optionsFromSingle : [option1, option2, option3, option4];
      options = options.map((o) => String(o ?? ""));
      if (options.length < 2) {
        // Ensure at least 4 slots for editor UX consistency
        options = [...options, "", "", "", ""].slice(0, 4);
      } else {
        options = [...options, "", "", "", ""].slice(0, 4);
      }

      const correct_answer = normalizeCorrectAnswer(get("correct_answer"));

      questions.push({
        question_type: "multiple_choice",
        question,
        options,
        correct_answer,
        explanation,
        max_marks,
      });
    }

    if (questions.length === 0) {
      toast({ 
        title: "No questions found", 
        description: "No valid question rows were found in the CSV. Please check the format.", 
        variant: "destructive" 
      });
      return;
    }

    const nextQuestions =
      quizImportMode === "replace" ? questions : [...(quizData.questions || []), ...questions];

    const updated = {
      ...quizData,
      questions: nextQuestions,
    };
    setQuizData(updated);
    onChange({ ...(content || {}), quiz_data: updated });
    
    if (quizImportMode === "replace") {
      toast({ 
        title: "Imported", 
        description: `Replaced all questions with ${questions.length} question(s) from CSV.` 
      });
    } else {
      toast({ 
        title: "Imported", 
        description: `Added ${questions.length} question(s) from CSV. Total: ${nextQuestions.length} questions.` 
      });
    }
  };

  const [csvUploading, setCsvUploading] = useState(false);

  const onQuizCsvSelected = async (file: File | null) => {
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== '') {
      toast({ 
        title: "Invalid file type", 
        description: "Please select a CSV file (.csv)", 
        variant: "destructive" 
      });
      if (quizCsvInputRef.current) {
        quizCsvInputRef.current.value = "";
      }
      return;
    }

    setPendingCsvFile(file);
    setShowCsvConfirmDialog(true);
  };

  const handleCsvImportConfirm = async () => {
    if (!pendingCsvFile) return;
    const file = pendingCsvFile;

    setCsvUploading(true);
    setShowCsvConfirmDialog(false);
    try {
      const text = await file.text();
      if (!text || text.trim().length === 0) {
        toast({ 
          title: "Empty file", 
          description: "The CSV file appears to be empty.", 
          variant: "destructive" 
        });
        return;
      }
      importQuizQuestionsFromCsv(text);
    } catch (e: any) {
      toast({ 
        title: "Import failed", 
        description: e?.message || "Failed to read CSV file. Please check the file format.", 
        variant: "destructive" 
      });
    } finally {
      setCsvUploading(false);
      if (quizCsvInputRef.current) {
        quizCsvInputRef.current.value = "";
      }
    }
  };

  const updateQuizQuestion = (index: number, field: string, value: any) => {
    const updated = {
      ...quizData,
      questions: quizData.questions.map((q: any, i: number) =>
        i === index ? { ...q, [field]: value } : q
      ),
    };
    setQuizData(updated);
    onChange({ ...(content || {}), quiz_data: updated });
  };

  const removeQuizQuestion = (index: number) => {
    const updated = {
      ...quizData,
      questions: quizData.questions.filter((_: any, i: number) => i !== index),
    };
    setQuizData(updated);
    onChange({ ...(content || {}), quiz_data: updated });
  };

  const updateQuizAssessmentType = (value: "cat" | "final_exam") => {
    const updated = {
      ...quizData,
      assessment_type: value,
    };
    setQuizData(updated);
    onChange({ ...(content || {}), quiz_data: updated });
  };

  const syncResources = (next: ResourceItem[]) => {
    setResources(next);
    onChange({ resources: next });
  };

  const addResourceLink = () => {
    const title = resourceTitle.trim();
    const url = resourceUrl.trim();
    if (!title || !url) {
      toast({
        title: "Missing fields",
        description: "Add a title and a URL for the resource link.",
        variant: "destructive",
      });
      return;
    }
    syncResources([...resources, { title, url, kind: "link" }]);
    setResourceTitle("");
    setResourceUrl("");
  };

  const removeResource = (index: number) => {
    syncResources(resources.filter((_, i) => i !== index));
  };

  const uploadResourceFile = async (file: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Not signed in",
          description: "Sign in as an admin to upload files.",
          variant: "destructive",
        });
        return;
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "resource");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to upload resource");
      }

      syncResources([
        ...resources,
        {
          title: file.name,
          url: data.url,
          path: data.path,
          kind: "file",
        },
      ]);

      toast({
        title: "Uploaded",
        description: "Resource uploaded successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: e?.message || "Failed to upload resource.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (contentType === "text") {
    const editorBlock = (
      <div className="space-y-3">
        <Label>Lesson Content</Label>

        <Tabs value={activeTextTab} onValueChange={(v) => setActiveTextTab(v as any)}>
          <TabsList>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Upload image"
                title="Upload image"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  void onImageFileSelected(file);
                  e.target.value = "";
                }}
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                onClick={() => setFullscreen((v) => !v)}
              >
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              <Button
                type="button"
                variant={editor?.isActive("heading", { level: 1 }) ? "default" : "outline"}
                size="icon"
                title="Heading 1"
                onClick={() => setHeading(1)}
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor?.isActive("heading", { level: 2 }) ? "default" : "outline"}
                size="icon"
                title="Heading 2"
                onClick={() => setHeading(2)}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor?.isActive("heading", { level: 3 }) ? "default" : "outline"}
                size="icon"
                title="Heading 3"
                onClick={() => setHeading(3)}
              >
                <Heading3 className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant={editor?.isActive("bold") ? "default" : "outline"}
                size="icon"
                title="Bold"
                onClick={() => editor?.chain().focus().toggleBold().run()}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor?.isActive("italic") ? "default" : "outline"}
                size="icon"
                title="Italic"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor?.isActive("underline") ? "default" : "outline"}
                size="icon"
                title="Underline"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
              >
                <Underline className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant={editor?.isActive("bulletList") ? "default" : "outline"}
                size="icon"
                title="Bulleted list"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor?.isActive("orderedList") ? "default" : "outline"}
                size="icon"
                title="Numbered list"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant={editor?.isActive({ textAlign: "left" }) ? "default" : "outline"}
                size="icon"
                title="Align left"
                onClick={() => editor?.chain().focus().setTextAlign("left").run()}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor?.isActive({ textAlign: "center" }) ? "default" : "outline"}
                size="icon"
                title="Align center"
                onClick={() => editor?.chain().focus().setTextAlign("center").run()}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor?.isActive({ textAlign: "right" }) ? "default" : "outline"}
                size="icon"
                title="Align right"
                onClick={() => editor?.chain().focus().setTextAlign("right").run()}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor?.isActive({ textAlign: "justify" }) ? "default" : "outline"}
                size="icon"
                title="Justify"
                onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
              >
                <AlignJustify className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Indent"
                onClick={() => editor?.chain().focus().sinkListItem("listItem").run()}
                disabled={!editor?.can().sinkListItem("listItem")}
              >
                <IndentIncrease className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Outdent"
                onClick={() => editor?.chain().focus().liftListItem("listItem").run()}
                disabled={!editor?.can().liftListItem("listItem")}
              >
                <IndentDecrease className="h-4 w-4" />
              </Button>

              <Select
                value={editor?.getAttributes("textStyle")?.fontFamily || "default"}
                onValueChange={(value) => {
                  if (!editor) return;
                  if (value === "default") {
                    editor.chain().focus().unsetFontFamily().run();
                    return;
                  }
                  editor.chain().focus().setFontFamily(value).run();
                }}
              >
                <SelectTrigger className="h-9 w-[170px]">
                  <SelectValue placeholder="Font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                  <SelectItem value="Georgia, serif">Georgia</SelectItem>
                  <SelectItem value="'Times New Roman', Times, serif">Times New Roman</SelectItem>
                  <SelectItem value="'Courier New', Courier, monospace">Courier New</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={editor?.getAttributes("textStyle")?.color || "default"}
                onValueChange={(value) => setTextColor(value)}
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Text color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Text: Default</SelectItem>
                  <SelectItem value="#111827">Text: Black</SelectItem>
                  <SelectItem value="#2563eb">Text: Blue</SelectItem>
                  <SelectItem value="#16a34a">Text: Green</SelectItem>
                  <SelectItem value="#dc2626">Text: Red</SelectItem>
                  <SelectItem value="#a855f7">Text: Purple</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={editor?.getAttributes("highlight")?.color || "none"}
                onValueChange={(value) => setHighlightColor(value)}
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Highlight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Highlight: None</SelectItem>
                  <SelectItem value="#fef08a">Highlight: Yellow</SelectItem>
                  <SelectItem value="#bbf7d0">Highlight: Green</SelectItem>
                  <SelectItem value="#bfdbfe">Highlight: Blue</SelectItem>
                  <SelectItem value="#fecaca">Highlight: Red</SelectItem>
                  <SelectItem value="#e9d5ff">Highlight: Purple</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={editor?.getAttributes("paragraph")?.lineHeight || "default"}
                onValueChange={(value) => setLineHeight(value)}
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Line height" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Line: Default</SelectItem>
                  <SelectItem value="1">Line: 1</SelectItem>
                  <SelectItem value="1.25">Line: 1.25</SelectItem>
                  <SelectItem value="1.5">Line: 1.5</SelectItem>
                  <SelectItem value="1.75">Line: 1.75</SelectItem>
                  <SelectItem value="2">Line: 2</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Insert table"
                onClick={insertTable}
              >
                <Table2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Add row"
                onClick={() => editor?.chain().focus().addRowAfter().run()}
                disabled={!editor?.can().addRowAfter()}
              >
                <Rows3 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Add column"
                onClick={() => editor?.chain().focus().addColumnAfter().run()}
                disabled={!editor?.can().addColumnAfter()}
              >
                <Columns3 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Delete table"
                onClick={() => editor?.chain().focus().deleteTable().run()}
                disabled={!editor?.can().deleteTable()}
              >
                <Trash className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Horizontal rule"
                onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Clear formatting"
                onClick={clearFormatting}
              >
                <Paintbrush className="h-4 w-4" />
              </Button>

              <Select
                value={editor?.getAttributes("textStyle")?.fontSize || "default"}
                onValueChange={(value) => {
                  const v = value === "default" ? null : value;
                  editor?.chain().focus().setFontSize(v).run();
                }}
              >
                <SelectTrigger className="h-9 w-[120px]">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="12px">12px</SelectItem>
                  <SelectItem value="14px">14px</SelectItem>
                  <SelectItem value="16px">16px</SelectItem>
                  <SelectItem value="18px">18px</SelectItem>
                  <SelectItem value="20px">20px</SelectItem>
                  <SelectItem value="24px">24px</SelectItem>
                  <SelectItem value="28px">28px</SelectItem>
                  <SelectItem value="32px">32px</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Decrease font size"
                onClick={() => changeFontSizeBy(-2)}
              >
                A-
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Increase font size"
                onClick={() => changeFontSizeBy(2)}
              >
                A+
              </Button>

              <Button
                type="button"
                variant={editor?.isActive("code") ? "default" : "outline"}
                size="icon"
                title="Inline code"
                onClick={() => editor?.chain().focus().toggleCode().run()}
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor?.isActive("codeBlock") ? "default" : "outline"}
                size="sm"
                title="Code block"
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              >
                <FileText className="h-4 w-4 mr-2" />
                Code block
              </Button>

              <Button
                type="button"
                variant={editor?.isActive("link") ? "default" : "outline"}
                size="icon"
                title="Link"
                onClick={upsertLink}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Unlink"
                onClick={removeLink}
                disabled={!editor?.isActive("link")}
              >
                <Unlink className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Undo"
                onClick={() => editor?.chain().focus().undo().run()}
                disabled={!editor?.can().undo()}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Redo"
                onClick={() => editor?.chain().focus().redo().run()}
                disabled={!editor?.can().redo()}
              >
                <Redo2 className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Insert image"
                onClick={openImagePicker}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={replaceSelectedImage}
                disabled={!editor?.isActive("image")}
              >
                Replace image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeSelectedImage}
                disabled={!editor?.isActive("image")}
              >
                Remove image
              </Button>
            </div>

            <EditorContent editor={editor} />
          </TabsContent>

          <TabsContent value="html" className="space-y-2">
            <Textarea
              value={textContent}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter lesson content here (HTML)."
              rows={12}
              className="font-mono text-sm"
            />
          </TabsContent>
        </Tabs>
      </div>

    );

    if (!fullscreen) {
      return editorBlock;
    }

    return (
      <div className="fixed inset-0 z-50 bg-background p-4 overflow-auto">
        {editorBlock}
      </div>
    );
  }

  if (contentType === "code") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Code Examples</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCodeExample}>
            <Plus className="h-4 w-4 mr-2" />
            Add Code Example
          </Button>
        </div>
        {codeExamples.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No code examples yet. Click "Add Code Example" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {codeExamples.map((example, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Example {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCodeExample(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={example.title}
                      onChange={(e) =>
                        updateCodeExample(index, "title", e.target.value)
                      }
                      placeholder="e.g., Basic React Component"
                    />
                  </div>
                  <div>
                    <Label>Code</Label>
                    <Textarea
                      value={example.code}
                      onChange={(e) =>
                        updateCodeExample(index, "code", e.target.value)
                      }
                      placeholder="Paste your code here"
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label>Explanation</Label>
                    <Textarea
                      value={example.explanation}
                      onChange={(e) =>
                        updateCodeExample(index, "explanation", e.target.value)
                      }
                      placeholder="Explain what this code does"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (contentType === "quiz") {
    return (
      <>
        <div className="space-y-4">
        {/* Assessment Type Selection - Improved UI */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quiz Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-assessment-type" className="text-sm font-semibold">
                Assessment Type *
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateQuizAssessmentType("cat")}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all text-left",
                    quizData?.assessment_type === "cat"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="font-semibold mb-1">CAT (Continuous Assessment)</div>
                  <div className="text-xs text-muted-foreground">
                    Counts towards 30% of final grade
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateQuizAssessmentType("final_exam")}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all text-left",
                    quizData?.assessment_type === "final_exam"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="font-semibold mb-1">Final Exam</div>
                  <div className="text-xs text-muted-foreground">
                    Counts towards 70% of final grade
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CSV Import Section - Improved UI */}
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Import Questions from CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={quizImportMode}
                onValueChange={(value: any) => setQuizImportMode(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="append">Append to existing</SelectItem>
                  <SelectItem value="replace">Replace all questions</SelectItem>
                </SelectContent>
              </Select>

              <input
                ref={quizCsvInputRef}
                id="quiz-csv-import"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                aria-label="Import quiz questions from CSV"
                onChange={(e) => void onQuizCsvSelected(e.target.files?.[0] || null)}
              />

              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto gap-2"
                onClick={() => {
                  quizCsvInputRef.current?.click();
                }}
                disabled={csvUploading}
              >
                {csvUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Importing...</span>
                    <span className="sm:hidden">Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Import CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </>
                )}
              </Button>
            </div>
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-semibold mb-1">CSV Format:</p>
              <p>Required columns: question, question_type</p>
              <p>Optional: options (pipe-separated), option_1, option_2, option_3, option_4, correct_answer, explanation, max_marks</p>
            </div>
          </CardContent>
        </Card>

        {/* Add Question Button */}
        <div className="flex justify-end">
          <Button type="button" variant="default" onClick={addQuizQuestion} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>
        {quizData.questions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No questions yet. Click "Add Question" to create a quiz.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quizData.questions.map((question: any, index: number) => (
              <Card key={index} className="border">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">Question {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuizQuestion(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`quiz-question-type-${index}`} className="text-sm font-semibold">
                        Answer Type
                      </Label>
                      <Select
                        value={question.question_type || "multiple_choice"}
                        onValueChange={(value) =>
                          updateQuizQuestion(index, "question_type", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">
                            Multiple Choice (Auto-graded)
                          </SelectItem>
                          <SelectItem value="free_text">
                            Free Text (Manual Review)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`quiz-question-marks-${index}`} className="text-sm font-semibold">
                        Max Marks
                      </Label>
                      <Input
                        id={`quiz-question-marks-${index}`}
                        type="number"
                        min={0}
                        step={1}
                        value={
                          typeof question.max_marks === "number" && Number.isFinite(question.max_marks)
                            ? question.max_marks
                            : 1
                        }
                        onChange={(e) => {
                          const raw = parseInt(e.target.value, 10);
                          const safe = Number.isFinite(raw) ? Math.max(0, raw) : 0;
                          updateQuizQuestion(index, "max_marks", safe);
                        }}
                        placeholder="1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Question *</Label>
                    <Input
                      value={question.question}
                      onChange={(e) =>
                        updateQuizQuestion(index, "question", e.target.value)
                      }
                      placeholder="Enter your question"
                      className="w-full"
                    />
                  </div>
                  {(question.question_type || "multiple_choice") === "multiple_choice" ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Answer Options</Label>
                      <div className="space-y-2">
                        {(question.options || ["", "", "", ""]).map((option: string, optIndex: number) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              aria-label={`Mark option ${optIndex + 1} as correct`}
                              checked={question.correct_answer === optIndex}
                              onChange={() =>
                                updateQuizQuestion(index, "correct_answer", optIndex)
                              }
                              className="mt-0.5 h-4 w-4 text-primary"
                            />
                            <Input
                              value={option}
                              onChange={(e) => {
                                const updatedOptions = [...(question.options || ["", "", "", ""])];
                                updatedOptions[optIndex] = e.target.value;
                                updateQuizQuestion(index, "options", updatedOptions);
                              }}
                              placeholder={`Option ${optIndex + 1}${optIndex === question.correct_answer ? " (Correct)" : ""}`}
                              className={question.correct_answer === optIndex ? "border-primary" : ""}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select the radio button next to the correct answer
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                      <p className="font-medium mb-1">Free Text Question</p>
                      <p className="text-muted-foreground text-xs">
                        Students will type their answer. This question will require manual review by an instructor.
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-semibold">Explanation (shown after answer)</Label>
                    <Textarea
                      value={question.explanation || ""}
                      onChange={(e) =>
                        updateQuizQuestion(index, "explanation", e.target.value)
                      }
                      placeholder="Explain why this is the correct answer (optional)"
                      rows={2}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CSV Import Confirmation Dialog */}
      <AlertDialog open={showCsvConfirmDialog} onOpenChange={(open) => {
        setShowCsvConfirmDialog(open);
        if (!open && pendingCsvFile) {
          setPendingCsvFile(null);
          if (quizCsvInputRef.current) {
            quizCsvInputRef.current.value = "";
          }
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import CSV File?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>File: <strong>{pendingCsvFile?.name}</strong></p>
                <p>Mode: <strong>{quizImportMode === "replace" ? "REPLACE" : "APPEND"}</strong></p>
                <p>
                  This will {quizImportMode === "replace" 
                    ? "replace all your current questions" 
                    : "add to your existing questions"}.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCsvImportConfirm}>
              Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
    );
  }

  if (contentType === "resource") {
    return (
      <>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resource-upload">Upload a resource file</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="resource-upload"
                type="file"
                aria-label="Upload a resource file"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void uploadResourceFile(file);
                  }
                  e.currentTarget.value = "";
                }}
              />
              <Button type="button" variant="outline" disabled={uploading} className="gap-2">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports PDF, ZIP, images, docs, spreadsheets, text/markdown (max 25MB).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Add a link</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="Resource title"
              />
              <Input
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://..."
              />
              <Button 
                type="button" 
                onClick={addResourceLink} 
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Link
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Resources</Label>
            {resources.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No resources added yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {resources.map((r, index) => (
                  <Card key={`${r.url}-${index}`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-md bg-muted">
                        {r.kind === "file" ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <LinkIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.url}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResource(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CSV Import Confirmation Dialog */}
        <AlertDialog open={showCsvConfirmDialog} onOpenChange={(open) => {
          setShowCsvConfirmDialog(open);
          if (!open && pendingCsvFile) {
            setPendingCsvFile(null);
            if (quizCsvInputRef.current) {
              quizCsvInputRef.current.value = "";
            }
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Import CSV File?</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-2">
                  <p>File: <strong>{pendingCsvFile?.name}</strong></p>
                  <p>Mode: <strong>{quizImportMode === "replace" ? "REPLACE" : "APPEND"}</strong></p>
                  <p>
                    This will {quizImportMode === "replace" 
                      ? "replace all your current questions" 
                      : "add to your existing questions"}.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCsvImportConfirm}>
                Import
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return null;
}









