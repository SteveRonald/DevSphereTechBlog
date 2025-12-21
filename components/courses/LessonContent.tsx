"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Play, Code, FileText, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

interface Lesson {
  id: string;
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
  const [videoWatched, setVideoWatched] = useState(false);

  const handleVideoProgress = (progress: { playedSeconds: number; played: number }) => {
    // Mark as watched if user watched at least 80% of the video
    if (progress.played >= 0.8 && !videoWatched) {
      setVideoWatched(true);
    }
  };

  const handleComplete = () => {
    if (lesson.content_type === "video" && !videoWatched) {
      // For videos, require watching before completion
      return;
    }
    onComplete();
  };

  const renderContent = () => {
    switch (lesson.content_type) {
      case "video":
        return (
          <div className="space-y-4">
            {lesson.video_url ? (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                <ReactPlayer
                  url={lesson.video_url}
                  width="100%"
                  height="100%"
                  controls
                  onProgress={handleVideoProgress}
                  config={{
                    youtube: {
                      playerVars: { showinfo: 0 },
                    },
                  }}
                />
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
          </div>
        );

      case "text":
        return (
          <div className="prose prose-sm max-w-none">
            {lesson.content?.text_content ? (
              <div dangerouslySetInnerHTML={{ __html: lesson.content.text_content }} />
            ) : (
              <p className="text-muted-foreground">{lesson.description || "No content available"}</p>
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
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Quiz functionality coming soon</p>
            </CardContent>
          </Card>
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

  const canComplete =
    lesson.content_type === "video" ? videoWatched : true;

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
              {lesson.content_type === "video" && !videoWatched
                ? "Watch at least 80% of the video to complete"
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

