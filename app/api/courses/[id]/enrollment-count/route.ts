import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// GET: Fetch real-time enrollment count for a course
// Public endpoint - only returns count, not individual student data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const supabase = createServerClient(request);

    // Verify course exists and is published
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, is_published")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Only show enrollment count for published courses
    if (!course.is_published) {
      return NextResponse.json({ count: 0 });
    }

    // Get real-time enrollment count directly from enrollments table
    // This ensures we always get the accurate, up-to-date count
    const { count, error } = await supabase
      .from("user_course_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("course_id", courseId);

    if (error) {
      console.error("Error fetching enrollment count:", error);
      return NextResponse.json(
        { error: "Failed to fetch enrollment count" },
        { status: 500 }
      );
    }

    // Return only the count - no individual student data for security
    return NextResponse.json({ 
      count: count || 0 
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate' // Always fetch fresh data for accurate counts
      }
    });
  } catch (error: any) {
    console.error("Enrollment count API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch enrollment count" },
      { status: 500 }
    );
  }
}


