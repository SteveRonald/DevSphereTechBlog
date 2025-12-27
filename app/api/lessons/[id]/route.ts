import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// PUT: Update lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const supabase = createServerClient(request);

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

    const { data: existingLesson, error: existingError } = await supabase
      .from("lessons")
      .select("course_id")
      .eq("id", id)
      .single();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 400 });
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("is_published")
      .eq("id", existingLesson.course_id)
      .single();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 400 });
    }

    const nextContentType = typeof body?.content_type === "string" ? body.content_type : undefined;
    const nextContent = body?.content;
    const isFinalExamUpdate =
      nextContentType === "quiz" &&
      (nextContent as any)?.quiz_data?.assessment_type === "final_exam";

    if (isFinalExamUpdate) {
      const { data: existingFinal, error: existingFinalError } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", existingLesson.course_id)
        .neq("id", id)
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

    const { is_published: _ignoredIsPublished, ...patch } = (body || {}) as Record<string, any>;

    const { data, error } = await supabase
      .from("lessons")
      .update({
        ...patch,
        is_published: course?.is_published === true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ lesson: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createServerClient(request);

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

    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}









