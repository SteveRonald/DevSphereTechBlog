"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Play, Code, FileText, HelpCircle, Download, Link as LinkIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { QuizComponent } from "./QuizComponent";
import { ProjectSubmission } from "./ProjectSubmission";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

interface Lesson {
  id: string;
  course_id?: string;
  title: string;
  content_type: string;
  content: any;
  video_url?: string;
  description?: string;
}

interface LessonContentProps {
  lesson: Lesson;
  isCompleted: boolean;
  onComplete: () => void;
}

export function LessonContent({ lesson, isCompleted, onComplete }: LessonContentProps) {
  const [quizFinished, setQuizFinished] = useState(false);

  const normalizedVideoUrl = (() => {
    if (typeof lesson.video_url !== "string") return "";
    const raw = lesson.video_url.trim();
    if (!raw) return "";

    // Normalize youtu.be short links to canonical watch URL.
    const m = raw.match(/^https?:\/\/(?:www\.)?youtu\.be\/([^?&#/]+)(?:[?&#].*)?$/i);
    if (m?.[1]) return `https://www.youtube.com/watch?v=${m[1]}`;
    return raw;
  })();

  const youtubeVideoId = (() => {
    if (!normalizedVideoUrl) return "";
    // youtu.be already normalized above, but keep robust parsing for watch/embed.
    const m1 = normalizedVideoUrl.match(/^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([^?&#/]+)(?:[?&#].*)?$/i);
    if (m1?.[1]) return m1[1];

    const m2 = normalizedVideoUrl.match(/^https?:\/\/(?:www\.)?youtube\.com\/embed\/([^?&#/]+)(?:[?&#].*)?$/i);
    if (m2?.[1]) return m2[1];

    return "";
  })();

  const renderMarkdown = (value: string) => {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {value}
        </ReactMarkdown>
      </div>
    );
  };

  const handleComplete = () => {
    onComplete();
  };

  const renderContent = () => {
    switch (lesson.content_type) {
      case "video":
        return (
          <div className="space-y-4">
            {normalizedVideoUrl ? (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                {youtubeVideoId ? (
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1&playsinline=1`}
                    title={lesson.title || "YouTube video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <ReactPlayer url={normalizedVideoUrl} width="100%" height="100%" controls />
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Video content coming soon</p>
                </CardContent>
              </Card>
            )}
            {lesson.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">{lesson.description}</p>
              </div>
            )}

            {typeof lesson.content?.text_content === "string" && lesson.content.text_content.trim() ? (
              <div className="pt-2">{renderMarkdown(lesson.content.text_content)}</div>
            ) : null}
          </div>
        );

      case "project":
        return (
          <div className="space-y-4">
            {typeof lesson.content?.text_content === "string" && lesson.content.text_content.trim()
              ? renderMarkdown(lesson.content.text_content)
              : null}

            <ProjectSubmission courseId={lesson.course_id || ""} lessonId={lesson.id} />
          </div>
        );

      case "text":
        return (
          <div>
            {typeof lesson.content?.text_content === "string" && lesson.content.text_content.trim()
              ? renderMarkdown(lesson.content.text_content)
              : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground">{lesson.description || "No content available"}</p>
                </div>
              )}
          </div>
        );

      case "code":
        return (
          <div className="space-y-4">
            {lesson.content?.code_examples ? (
              <div className="space-y-4">
                {lesson.content.code_examples.map((example: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      {example.title && (
                        <h4 className="font-semibold mb-2">{example.title}</h4>
                      )}
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code>{example.code}</code>
                      </pre>
                      {example.explanation && (
                        <p className="text-sm text-muted-foreground mt-2">{example.explanation}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Code examples coming soon</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "quiz":
        return (
          <div className="space-y-4">
            {lesson.content?.quiz_data?.questions?.length > 0 ? (
              <QuizComponent
                quizData={lesson.content.quiz_data}
                courseId={lesson.course_id || ""}
                lessonId={lesson.id}
                onFinished={() => setQuizFinished(true)}
                onComplete={() => {
                  onComplete();
                }}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No quiz data available</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "resource":
        return (
          <div className="space-y-4">
            {Array.isArray(lesson.content?.resources) && lesson.content.resources.length > 0 ? (
              <div className="space-y-3">
                {lesson.content.resources.map((r: any, index: number) => (
                  <Card key={`${r?.url || "resource"}-${index}`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-md bg-muted">
                        {r?.kind === "file" ? (
                          <Download className="h-4 w-4" />
                        ) : (
                          <LinkIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{r?.title || "Resource"}</p>
                        {r?.url && (
                          <p className="text-xs text-muted-foreground truncate">{r.url}</p>
                        )}
                      </div>
                      {r?.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex"
                        >
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </a>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No resources available</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Content coming soon</p>
            </CardContent>
          </Card>
        );
    }
  };

  const quizRequiresManualReview =
    lesson.content_type === "quiz"
      ? Boolean(
          lesson.content?.quiz_data?.questions?.some((q: any) => (q?.question_type || "multiple_choice") === "free_text")
        )
      : false;

  const canComplete =
    lesson.content_type === "quiz"
      ? !quizRequiresManualReview && quizFinished
      : lesson.content_type === "project"
      ? false
      : true;

  return (
    <div className="space-y-6">
      {renderContent()}

      {/* Completion Button */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Lesson Completed!</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              {lesson.content_type === "project"
                ? "Submit your project for review to proceed"
                : "Mark this lesson as complete to proceed"}
            </span>
          )}
        </div>
        <Button
          onClick={handleComplete}
          disabled={isCompleted || !canComplete}
          className="gap-2"
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Mark as Complete
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

