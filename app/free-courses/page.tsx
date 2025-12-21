import { Sidebar } from "@/components/blog/Sidebar";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Filter } from "lucide-react";
import { CourseCard, type Course } from "@/components/courses/CourseCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

async function getCourses(): Promise<{ courses: Course[]; total: number }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/courses`, {
      cache: "no-store",
    });
    
    if (!response.ok) {
      console.error("Failed to fetch courses");
      return { courses: [], total: 0 };
    }
    
    const data = await response.json();
    return { courses: data.courses || [], total: data.total || 0 };
  } catch (error) {
    console.error("Error fetching courses:", error);
    return { courses: [], total: 0 };
  }
}

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function FreeCoursesPage() {
  const { courses, total } = await getCourses();

  return (
    <>
      <div className="bg-muted/30 py-12 border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Free Courses</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Step-by-step guides and free courses to help you learn new technologies, frameworks, and best practices. 
            From beginner-friendly introductions to advanced techniques.
          </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              className="pl-10"
            />
          </div>
          <Select>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="web-development">Web Development</SelectItem>
              <SelectItem value="ai-ml">AI & Machine Learning</SelectItem>
              <SelectItem value="mobile">Mobile Development</SelectItem>
              <SelectItem value="devops">DevOps</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-8">
            {courses.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {courses.length} of {total} courses
                </div>
                <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
                
                {total > courses.length && (
                  <div className="mt-10 flex justify-center">
                    <Button variant="outline" size="lg">Load More</Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No free courses yet</p>
                <p className="text-sm">Check back soon for new free courses!</p>
              </div>
            )}
          </div>
          
          <aside className="lg:col-span-4">
            <Sidebar />
          </aside>
        </div>
      </div>
    </>
  );
}
