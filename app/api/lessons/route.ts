import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// GET: Fetch lessons for a course
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("course_id");
    const includeDrafts = searchParams.get("include_drafts") === "true";
    
    if (!courseId) {
      return NextResponse.json({ error: "course_id is required" }, { status: 400 });
    }

    const supabase = await createServerClient(request);
    if (includeDrafts) {
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
      const {
        data: { user },
      } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    let query = supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("step_number", { ascending: true });

    if (!includeDrafts) {
      query = query.eq("is_published", true);
    }

    const { data: lessons, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lessons: lessons || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create new lesson
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createServerClient(request);

    // Check admin
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const {
      data: { user },
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!body?.course_id) {
      return NextResponse.json({ error: "course_id is required" }, { status: 400 });
    }

    const isFinalExam =
      body?.content_type === "quiz" &&
      (body?.content as any)?.quiz_data?.assessment_type === "final_exam";

    if (isFinalExam) {
      const { data: existingFinal, error: existingFinalError } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", body.course_id)
        .eq("content_type", "quiz")
        .contains("content", { quiz_data: { assessment_type: "final_exam" } })
        .limit(1);

      if (existingFinalError) {
        return NextResponse.json({ error: existingFinalError.message }, { status: 400 });
      }

      if ((existingFinal || []).length > 0) {
        return NextResponse.json(
          { error: "This course already has a final exam quiz lesson." },
          { status: 400 }
        );
      }
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("is_published")
      .eq("id", body.course_id)
      .single();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        ...body,
        is_published: course?.is_published === true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ lesson: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}









