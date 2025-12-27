import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const supabase = createServerClient(request);

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, step_number, title, content_type, duration, is_preview")
      .eq("course_id", course.id)
      .order("step_number", { ascending: true })
      .limit(8);

    if (lessonsError) {
      return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
    }

    return NextResponse.json({ course, lessons: lessons || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
