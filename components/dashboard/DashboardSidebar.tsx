"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  FileText, 
  Award, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Play,
  Eye,
  Edit
} from "lucide-react";
import Link from "next/link";

interface DashboardSidebarProps {
  courses: any[];
}

export function DashboardSidebar({ courses }: DashboardSidebarProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "exams" | "quizzes">("overview");

  // Extract all activities from courses
  const allProjects = courses.flatMap(course => 
    course.enrollment?.course_lessons?.filter((lesson: any) => lesson.lesson_type === "project") || []
  );

  const allExams = courses.flatMap(course => 
    course.enrollment?.course_lessons?.filter((lesson: any) => lesson.lesson_type === "final_exam") || []
  );

  const allQuizzes = courses.flatMap(course => 
    course.enrollment?.course_lessons?.filter((lesson: any) => lesson.lesson_type === "quiz") || []
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "passed": return "bg-green-100 text-green-800 border-green-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "passed": return <CheckCircle className="h-4 w-4" />;
      case "failed": return <AlertCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "in_progress": return <Play className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full lg:w-80 space-y-6">
      {/* Tab Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Learning Activities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={activeTab === "overview" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("overview")}
              className="text-xs"
            >
              Overview
            </Button>
            <Button
              variant={activeTab === "projects" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("projects")}
              className="text-xs"
            >
              Projects
            </Button>
            <Button
              variant={activeTab === "exams" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("exams")}
              className="text-xs"
            >
              Final Exams
            </Button>
            <Button
              variant={activeTab === "quizzes" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("quizzes")}
              className="text-xs"
            >
              Quizzes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === "overview" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-700">{allProjects.length}</div>
                <div className="text-xs text-blue-600">Projects</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-700">{allQuizzes.length}</div>
                <div className="text-xs text-purple-600">Quizzes</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-700">{allExams.length}</div>
                <div className="text-xs text-green-600">Final Exams</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-amber-700">
                  {courses.filter(c => c.passed).length}
                </div>
                <div className="text-xs text-amber-600">Passed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "projects" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Projects ({allProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {allProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects found</p>
            ) : (
              allProjects.map((project: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium truncate">{project.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {project.courses?.title || "Course"}
                      </p>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(project.status || "pending")}`}>
                      {getStatusIcon(project.status || "pending")}
                      <span className="ml-1">{project.status || "Pending"}</span>
                    </Badge>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {project.status === "completed" ? (
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        <Edit className="h-3 w-3 mr-1" />
                        {project.status === "in_progress" ? "Continue" : "Start"}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "exams" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5" />
              Final Exams ({allExams.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {allExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No final exams found</p>
            ) : (
              allExams.map((exam: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium truncate">{exam.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {exam.courses?.title || "Course"}
                      </p>
                      {exam.score !== undefined && (
                        <p className="text-xs font-medium mt-1">
                          Score: {exam.score}/100
                        </p>
                      )}
                    </div>
                    <Badge className={`text-xs ${getStatusColor(exam.status || "pending")}`}>
                      {getStatusIcon(exam.status || "pending")}
                      <span className="ml-1">{exam.status || "Pending"}</span>
                    </Badge>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {exam.status === "completed" ? (
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    ) : exam.status === "failed" ? (
                      <Button size="sm" className="text-xs h-7">
                        <Play className="h-3 w-3 mr-1" />
                        Retake
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        <Play className="h-3 w-3 mr-1" />
                        {exam.status === "in_progress" ? "Continue" : "Start"}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "quizzes" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Quizzes ({allQuizzes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {allQuizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quizzes found</p>
            ) : (
              allQuizzes.map((quiz: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium truncate">{quiz.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {quiz.courses?.title || "Course"}
                      </p>
                      {quiz.score !== undefined && (
                        <p className="text-xs font-medium mt-1">
                          Score: {quiz.score}/{quiz.max_score || 30}
                        </p>
                      )}
                    </div>
                    <Badge className={`text-xs ${getStatusColor(quiz.status || "pending")}`}>
                      {getStatusIcon(quiz.status || "pending")}
                      <span className="ml-1">{quiz.status || "Pending"}</span>
                    </Badge>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {quiz.status === "completed" ? (
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        <Play className="h-3 w-3 mr-1" />
                        {quiz.status === "in_progress" ? "Continue" : "Start"}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
