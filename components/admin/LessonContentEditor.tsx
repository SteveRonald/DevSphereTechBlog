"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Trash2 } from "lucide-react";

interface LessonContentEditorProps {
  contentType: string;
  content: any;
  videoUrl?: string;
  onChange: (content: any, videoUrl?: string) => void;
}

export function LessonContentEditor({
  contentType,
  content,
  videoUrl,
  onChange,
}: LessonContentEditorProps) {
  const [textContent, setTextContent] = useState(content?.text_content || "");
  const [codeExamples, setCodeExamples] = useState<any[]>(content?.code_examples || []);
  const [quizData, setQuizData] = useState(content?.quiz_data || {
    questions: [],
  });

  const handleTextChange = (value: string) => {
    setTextContent(value);
    onChange({ text_content: value });
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
      question: "",
      options: ["", "", "", ""],
      correct_answer: 0,
      explanation: "",
    };
    const updated = {
      ...quizData,
      questions: [...quizData.questions, newQuestion],
    };
    setQuizData(updated);
    onChange({ quiz_data: updated });
  };

  const updateQuizQuestion = (index: number, field: string, value: any) => {
    const updated = {
      ...quizData,
      questions: quizData.questions.map((q: any, i: number) =>
        i === index ? { ...q, [field]: value } : q
      ),
    };
    setQuizData(updated);
    onChange({ quiz_data: updated });
  };

  const removeQuizQuestion = (index: number) => {
    const updated = {
      ...quizData,
      questions: quizData.questions.filter((_: any, i: number) => i !== index),
    };
    setQuizData(updated);
    onChange({ quiz_data: updated });
  };

  if (contentType === "text") {
    return (
      <div className="space-y-2">
        <Label>Lesson Content (HTML/Markdown supported)</Label>
        <Textarea
          value={textContent}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter lesson content here. You can use HTML or Markdown formatting."
          rows={12}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Tip: Use HTML tags or Markdown syntax for formatting. Links, lists, and code blocks are supported.
        </p>
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Quiz Questions</Label>
          <Button type="button" variant="outline" size="sm" onClick={addQuizQuestion}>
            <Plus className="h-4 w-4 mr-2" />
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
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Question {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuizQuestion(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Question</Label>
                    <Input
                      value={question.question}
                      onChange={(e) =>
                        updateQuizQuestion(index, "question", e.target.value)
                      }
                      placeholder="Enter your question"
                    />
                  </div>
                  <div>
                    <Label>Options</Label>
                    {question.options.map((option: string, optIndex: number) => (
                      <div key={optIndex} className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={question.correct_answer === optIndex}
                          onChange={() =>
                            updateQuizQuestion(index, "correct_answer", optIndex)
                          }
                          className="mt-1"
                        />
                        <Input
                          value={option}
                          onChange={(e) => {
                            const updatedOptions = [...question.options];
                            updatedOptions[optIndex] = e.target.value;
                            updateQuizQuestion(index, "options", updatedOptions);
                          }}
                          placeholder={`Option ${optIndex + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label>Explanation (shown after answer)</Label>
                    <Textarea
                      value={question.explanation}
                      onChange={(e) =>
                        updateQuizQuestion(index, "explanation", e.target.value)
                      }
                      placeholder="Explain why this is the correct answer"
                      rows={2}
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

  return null;
}

