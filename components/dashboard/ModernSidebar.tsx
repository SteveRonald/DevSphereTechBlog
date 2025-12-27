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
  Edit,
  Loader2,
  Calendar
} from "lucide-react";
import Link from "next/link";

interface ModernSidebarProps {
  courses: any[];
}

export function ModernSidebar({ courses }: ModernSidebarProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "exams" | "quizzes">("overview");
  const [loading, setLoading] = useState(false);

  // Extract all activities from courses
  const allProjects = courses.flatMap(course => {
    // For now, create mock data based on course enrollment
    const mockProjects = [
      {
        id: `project-${course.enrollment?.courses?.id}`,
        title: `${course.enrollment?.courses?.title} - Final Project`,
        course_title: course.enrollment?.courses?.title,
        course_slug: course.enrollment?.courses?.slug,
        status: course.passed ? "completed" : course.enrollment?.is_completed ? "failed" : "in_progress",
        score: course.passed ? 85 : null,
        pending_review: false
      }
    ];
    return mockProjects;
  });

  const allExams = courses.flatMap(course => {
    const mockExams = [
      {
        id: `exam-${course.enrollment?.courses?.id}`,
        title: `${course.enrollment?.courses?.title} - Final Exam`,
        course_title: course.enrollment?.courses?.title,
        course_slug: course.enrollment?.courses?.slug,
        status: course.grades?.final_exam_graded ? (course.passed ? "completed" : "failed") : 
                course.grades?.final_exam_pending_review ? "completed" : "pending",
        score: course.grades?.final_score_100 || null,
        pending_review: course.grades?.final_exam_pending_review || false
      }
    ];
    return mockExams;
  });

  const allQuizzes = courses.flatMap(course => {
    const mockQuizzes = [
      {
        id: `quiz-${course.enrollment?.courses?.id}`,
        title: `${course.enrollment?.courses?.title} - Quiz Assessment`,
        course_title: course.enrollment?.courses?.title,
        course_slug: course.enrollment?.courses?.slug,
        status: course.grades?.cat_scaled_30 > 0 ? "completed" : "pending",
        score: course.grades?.cat_scaled_30 || null,
        pending_review: false
      }
    ];
    return mockQuizzes;
  });

  const getStatusColor = (status: string, pendingReview?: boolean) => {
    if (pendingReview) return "bg-amber-100 text-amber-800 border-amber-200";
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "passed": return "bg-green-100 text-green-800 border-green-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      case "pending": return "bg-gray-100 text-gray-800 border-gray-200";
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string, pendingReview?: boolean) => {
    if (pendingReview) return <Clock className="h-4 w-4" />;
    switch (status) {
      case "completed":
      case "passed": return <CheckCircle className="h-4 w-4" />;
      case "failed": return <AlertCircle className="h-4 w-4" />;
      case "pending": return <Calendar className="h-4 w-4" />;
      case "in_progress": return <Play className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string, pendingReview?: boolean) => {
    if (pendingReview) return "Pending Review";
    switch (status) {
      case "completed": return "Completed";
      case "passed": return "Passed";
      case "failed": return "Failed";
      case "pending": return "Not Started";
      case "in_progress": return "In Progress";
      default: return "Unknown";
    }
  };

  const ActivityCard = ({ activity, type }: { activity: any; type: string }) => {
  const getActivityLink = () => {
    if (type === "project") {
      return `/courses/${activity.course_slug}/learn`;
    } else if (type === "exam") {
      if (activity.status === "failed") {
        return `/courses/${activity.course_slug}/retake-final-exam`;
      } else if (activity.status === "completed") {
        return `/courses/${activity.course_slug}/learn`;
      } else {
        return `/courses/${activity.course_slug}/learn`;
      }
    } else if (type === "quiz") {
      return `/courses/${activity.course_slug}/learn`;
    }
    return "#";
  };

  return (
    <div className="group hover:shadow-md transition-all duration-200 border rounded-xl p-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm truncate group-hover:text-blue-600 transition-colors">
            {activity.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {activity.course_title}
          </p>
          {activity.score !== null && (
            <div className="mt-2">
              <span className="text-xs font-medium">
                Score: {activity.score}/{type === "quiz" ? "30" : "100"}
              </span>
            </div>
          )}
        </div>
        <Badge className={`text-xs flex-shrink-0 ${getStatusColor(activity.status, activity.pending_review)}`}>
          {getStatusIcon(activity.status, activity.pending_review)}
          <span className="ml-1">{getStatusText(activity.status, activity.pending_review)}</span>
        </Badge>
      </div>
      
      <div className="mt-4 flex gap-2">
        {activity.status === "completed" ? (
          <Button size="sm" variant="outline" className="text-xs h-8" asChild>
            <Link href={getActivityLink()}>
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Link>
          </Button>
        ) : activity.status === "failed" ? (
          <Button size="sm" className="text-xs h-8 bg-red-600 hover:bg-red-700" asChild>
            <Link href={getActivityLink()}>
              <Play className="h-3 w-3 mr-1" />
              Retake
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="text-xs h-8" asChild>
            <Link href={getActivityLink()}>
              <Play className="h-3 w-3 mr-1" />
              {activity.status === "in_progress" ? "Continue" : "Start"}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

  return (
    <div className="w-full lg:w-96 space-y-6">
      {/* Modern Tab Navigation */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Learning Hub
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "projects", label: "Projects", icon: FileText },
              { id: "exams", label: "Final Exams", icon: Award },
              { id: "quizzes", label: "Quizzes", icon: BookOpen }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-xs h-10 transition-all duration-200 ${
                  activeTab === tab.id 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                    : "hover:bg-gray-50"
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === "overview" && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Activity Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-700">{allProjects.length}</span>
                </div>
                <div className="text-sm font-medium text-blue-800 mt-2">Projects</div>
                <div className="text-xs text-blue-600">
                  {allProjects.filter(p => p.status === "completed").length} completed
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-700">{allQuizzes.length}</span>
                </div>
                <div className="text-sm font-medium text-purple-800 mt-2">Quizzes</div>
                <div className="text-xs text-purple-600">
                  {allQuizzes.filter(q => q.status === "completed").length} completed
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <Award className="h-8 w-8 text-green-600" />
                  <span className="text-2xl font-bold text-green-700">{allExams.length}</span>
                </div>
                <div className="text-sm font-medium text-green-800 mt-2">Final Exams</div>
                <div className="text-xs text-green-600">
                  {allExams.filter(e => e.status === "completed").length} completed
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <CheckCircle className="h-8 w-8 text-amber-600" />
                  <span className="text-2xl font-bold text-amber-700">
                    {courses.filter(c => c.passed).length}
                  </span>
                </div>
                <div className="text-sm font-medium text-amber-800 mt-2">Passed</div>
                <div className="text-xs text-amber-600">Courses completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "projects" && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Projects ({allProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : allProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No projects found</p>
              </div>
            ) : (
              allProjects.map((project, index) => (
                <ActivityCard key={index} activity={project} type="project" />
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "exams" && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Final Exams ({allExams.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : allExams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No final exams found</p>
              </div>
            ) : (
              allExams.map((exam, index) => (
                <ActivityCard key={index} activity={exam} type="exam" />
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "quizzes" && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              Quizzes ({allQuizzes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : allQuizzes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No quizzes found</p>
              </div>
            ) : (
              allQuizzes.map((quiz, index) => (
                <ActivityCard key={index} activity={quiz} type="quiz" />
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
