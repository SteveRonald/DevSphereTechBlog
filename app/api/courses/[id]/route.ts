import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// GET: Fetch single course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createServerClient(request);

    // Check if user is admin
    const authHeader = request.headers.get("authorization");
    let user;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        });
        if (response.ok) {
          user = await response.json();
        }
      } catch (error) {
        console.error("Error validating token:", error);
      }
    }

    if (!user) {
      const { data: { user: userFromToken } } = await supabase.auth.getUser();
      if (userFromToken) user = userFromToken;
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: course, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      notify_subscribers_about_update,
      ...coursePatch
    } = (body || {}) as Record<string, any>;
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

    const { data: beforeCourse, error: beforeError } = await supabase
      .from("courses")
      .select("is_published")
      .eq("id", id)
      .single();

    if (beforeError) {
      return NextResponse.json({ error: beforeError.message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("courses")
      .update({
        ...coursePatch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Notify subscribers only when course transitions from draft -> published.
    if (beforeCourse?.is_published === false && data?.is_published === true) {
      try {
        await supabase
          .from("lessons")
          .update({
            is_published: true,
            updated_at: new Date().toISOString(),
          })
          .eq("course_id", id);
      } catch (lessonPublishError) {
        console.error("Failed to publish lessons for course:", lessonPublishError);
      }

      // Notify newsletter subscribers
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        await fetch(`${siteUrl}/api/newsletter/notify-new-course`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course: {
              id: data.id,
              title: data.title,
              slug: data.slug,
              short_description: data.short_description,
              thumbnail_url: data.thumbnail_url,
              category: data.category,
              difficulty_level: data.difficulty_level,
              created_at: data.created_at,
            },
          }),
        });
      } catch (notifyError) {
        console.error("Failed to send course notifications:", notifyError);
      }

      // Notify enrolled students
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        await fetch(`${siteUrl}/api/courses/${id}/notify-enrolled-students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course: {
              id: data.id,
              title: data.title,
              slug: data.slug,
              short_description: data.short_description,
              thumbnail_url: data.thumbnail_url,
            },
          }),
        });
      } catch (enrolledNotifyError) {
        console.error("Failed to notify enrolled students:", enrolledNotifyError);
      }

      // Revalidate course pages
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        await fetch(`${siteUrl}/api/revalidate?path=/courses/${data.slug}`, {
          method: "GET",
        });
        await fetch(`${siteUrl}/api/revalidate?path=/free-courses`, {
          method: "GET",
        });
      } catch (revalidateError) {
        console.error("Failed to revalidate pages:", revalidateError);
      }
    }

    // Notify subscribers when a published course is updated, but only when explicitly requested.
    if (
      notify_subscribers_about_update === true &&
      beforeCourse?.is_published === true &&
      data?.is_published === true
    ) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        await fetch(`${siteUrl}/api/newsletter/notify-updated-course`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course: {
              id: data.id,
              title: data.title,
              slug: data.slug,
              short_description: data.short_description,
              thumbnail_url: data.thumbnail_url,
              category: data.category,
              difficulty_level: data.difficulty_level,
              updated_at: data.updated_at,
            },
          }),
        });
      } catch (notifyError) {
        console.error("Failed to send course update notifications:", notifyError);
      }
    }

    return NextResponse.json({ course: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    const { error } = await supabase
      .from("courses")
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









