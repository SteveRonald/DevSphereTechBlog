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
    const supabase = await createServerClient(request);

    // Verify course exists and is published
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, is_published, enrollment_count")
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

    // Return count from courses table (RLS-safe for public reads)
    return NextResponse.json({ 
      count: course.enrollment_count || 0 
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


