import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// POST: Create new course
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

    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug exists
    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", slug)
      .single();

    let finalSlug = slug;
    if (existing) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    const { data, error } = await supabase
      .from("courses")
      .insert({
        ...body,
        slug: finalSlug,
        instructor_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If the course is created already published, notify subscribers.
    if (data?.is_published === true) {
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
    }

    return NextResponse.json({ course: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}









