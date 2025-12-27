import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// Cache for 60 seconds
export const revalidate = 60;

// GET: Fetch published courses with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(request);
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const minDurationParam = searchParams.get("min_duration");
    const maxDurationParam = searchParams.get("max_duration");
    const minRatingParam = searchParams.get("min_rating");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const minDuration = minDurationParam ? parseInt(minDurationParam) : undefined;
    const maxDuration = maxDurationParam ? parseInt(maxDurationParam) : undefined;
    const minRating = minRatingParam ? parseFloat(minRatingParam) : undefined;

    let query = supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .range(offset, offset + limit - 1);

    // Sorting
    if (sort === "popular") {
      query = query.order("enrollment_count", { ascending: false }).order("created_at", { ascending: false });
    } else if (sort === "highest_rated") {
      query = query.order("rating", { ascending: false }).order("total_ratings", { ascending: false });
    } else if (sort === "duration") {
      query = query.order("estimated_duration", { ascending: true }).order("created_at", { ascending: false });
    } else {
      // newest (default)
      query = query.order("created_at", { ascending: false });
    }

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    if (difficulty) {
      query = query.eq("difficulty_level", difficulty);
    }

    if (typeof minDuration === "number" && !Number.isNaN(minDuration)) {
      query = query.gte("estimated_duration", minDuration);
    }

    if (typeof maxDuration === "number" && !Number.isNaN(maxDuration)) {
      query = query.lte("estimated_duration", maxDuration);
    }

    if (typeof minRating === "number" && !Number.isNaN(minRating)) {
      query = query.gte("rating", minRating);
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

    if (typeof minDuration === "number" && !Number.isNaN(minDuration)) {
      countQuery = countQuery.gte("estimated_duration", minDuration);
    }

    if (typeof maxDuration === "number" && !Number.isNaN(maxDuration)) {
      countQuery = countQuery.lte("estimated_duration", maxDuration);
    }

    if (typeof minRating === "number" && !Number.isNaN(minRating)) {
      countQuery = countQuery.gte("rating", minRating);
    }

    const { count } = await countQuery;

    const response = NextResponse.json({
      courses: courses || [],
      total: count || 0,
      limit,
      offset,
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return response;
  } catch (error: any) {
    console.error("Courses API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}









