import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// GET: Fetch published courses with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(request);
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    if (difficulty) {
      query = query.eq("difficulty_level", difficulty);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,short_description.ilike.%${search}%`);
    }

    const { data: courses, error } = await query;

    if (error) {
      console.error("Error fetching courses:", error);
      return NextResponse.json(
        { error: "Failed to fetch courses" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);

    if (category) {
      countQuery = countQuery.eq("category", category);
    }

    if (difficulty) {
      countQuery = countQuery.eq("difficulty_level", difficulty);
    }

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,short_description.ilike.%${search}%`);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      courses: courses || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Courses API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

