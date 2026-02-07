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
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert overflow-x-hidden break-words prose-headings:text-foreground prose-p:text-base prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground prose-strong:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-ul:text-base prose-ol:text-base prose-li:text-base prose-p:text-foreground/80 dark:prose-p:text-foreground/90 prose-li:text-foreground/80 dark:prose-li:text-foreground/90 prose-blockquote:text-foreground/80 dark:prose-blockquote:text-foreground/90">
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
          <div className="space-y-4 overflow-x-hidden">
            {normalizedVideoUrl ? (
              <div className="relative aspect-video w-full max-w-full rounded-lg overflow-hidden bg-black">
                {youtubeVideoId ? (
                  <iframe
                    className="absolute inset-0 h-full w-full max-w-full"
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
              <div className="prose prose-sm max-w-none overflow-x-hidden break-words">
                <p className="text-muted-foreground break-words">{lesson.description}</p>
              </div>
            )}

            {typeof lesson.content?.text_content === "string" && lesson.content.text_content.trim() ? (
              <div className="pt-2 overflow-x-hidden">{renderMarkdown(lesson.content.text_content)}</div>
            ) : null}
          </div>
        );

      case "project":
        return (
          <div className="space-y-4 overflow-x-hidden">
            {typeof lesson.content?.text_content === "string" && lesson.content.text_content.trim()
              ? renderMarkdown(lesson.content.text_content)
              : null}

            <ProjectSubmission courseId={lesson.course_id || ""} lessonId={lesson.id} />
          </div>
        );

      case "text":
        return (
          <div className="overflow-x-hidden">
            {typeof lesson.content?.text_content === "string" && lesson.content.text_content.trim()
              ? renderMarkdown(lesson.content.text_content)
              : (
                <div className="prose prose-sm sm:prose-base max-w-none overflow-x-hidden break-words">
                  <p className="text-base sm:text-lg text-muted-foreground break-words leading-relaxed">{lesson.description || "No content available"}</p>
                </div>
              )}
          </div>
        );

      case "code":
        return (
          <div className="space-y-4 overflow-x-hidden">
            {lesson.content?.code_examples ? (
              <div className="space-y-4">
                {lesson.content.code_examples.map((example: any, index: number) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-4 overflow-x-hidden">
                      {example.title && (
                        <h4 className="font-semibold mb-2 break-words">{example.title}</h4>
                      )}
                      <div className="w-full overflow-x-auto">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto max-w-full">
                          <code className="break-all whitespace-pre-wrap">{example.code}</code>
                        </pre>
                      </div>
                      {example.explanation && (
                        <p className="text-sm text-muted-foreground mt-2 break-words">{example.explanation}</p>
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
          <div className="space-y-4 overflow-x-hidden">
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
          <div className="space-y-4 overflow-x-hidden">
            {Array.isArray(lesson.content?.resources) && lesson.content.resources.length > 0 ? (
              <div className="space-y-3">
                {lesson.content.resources.map((r: any, index: number) => (
                  <Card key={`${r?.url || "resource"}-${index}`} className="overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3 overflow-x-hidden">
                      <div className="p-2 rounded-md bg-muted shrink-0">
                        {r?.kind === "file" ? (
                          <Download className="h-4 w-4" />
                        ) : (
                          <LinkIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-x-hidden">
                        <p className="font-medium truncate break-words">{r?.title || "Resource"}</p>
                        {r?.url && (
                          <p className="text-xs text-muted-foreground truncate break-all">{r.url}</p>
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
    <div className="space-y-6 overflow-x-hidden">
      {renderContent()}

      {/* Completion Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-border overflow-x-hidden">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isCompleted ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <span className="text-sm sm:text-base font-medium text-green-600 break-words">Lesson Completed!</span>
            </>
          ) : (
            <span className="text-sm sm:text-base text-muted-foreground break-words leading-relaxed">
              {lesson.content_type === "project"
                ? "Submit your project for review to proceed"
                : lesson.content_type === "quiz"
                ? quizRequiresManualReview
                  ? "Your quiz is pending review"
                  : "Complete this lesson to proceed"
                : "Mark this lesson as complete to proceed"}
            </span>
          )}
        </div>
        <Button
          onClick={handleComplete}
          disabled={isCompleted || !canComplete}
          className="gap-2 w-full sm:w-auto shrink-0 h-11 text-base"
          size="lg"
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

