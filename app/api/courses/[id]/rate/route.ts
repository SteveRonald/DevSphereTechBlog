import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const supabase = createServerClient(request);

    // Try to get user - check Authorization header first, then session
    let user;
    const authHeader = request.headers.get("authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Token is in header - validate it directly
      const token = authHeader.substring(7);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          user = userData;
        }
      } catch (error) {
        console.error("Error validating token:", error);
      }
    }
    
    // Fallback to Supabase client methods
    if (!user) {
      const { data: { user: userFromToken }, error: userError } = await supabase.auth.getUser();
      if (userFromToken) {
        user = userFromToken;
      } else {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session?.user) {
          user = session.user;
        }
        
        if (userError) {
          console.error("User error in rate route:", userError);
        }
        if (sessionError) {
          console.error("Session error in rate route:", sessionError);
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || typeof rating !== "number") {
      return NextResponse.json(
        { error: "Rating is required and must be a number" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if user is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("user_course_enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this course to rate it" },
        { status: 403 }
      );
    }

    // Check if user has already rated this course
    const { data: existingRating } = await supabase
      .from("course_ratings")
      .select("id, rating")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    let ratingId: string;
    if (existingRating) {
      // Update existing rating
      const { data, error } = await supabase
        .from("course_ratings")
        .update({
          rating,
          comment: comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRating.id)
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      ratingId = data.id;
    } else {
      // Create new rating
      const { data, error } = await supabase
        .from("course_ratings")
        .insert({
          user_id: user.id,
          course_id: courseId,
          rating,
          comment: comment || null,
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      ratingId = data.id;
    }

    // Recalculate course average rating
    const { data: ratings, error: ratingsError } = await supabase
      .from("course_ratings")
      .select("rating")
      .eq("course_id", courseId);

    if (ratingsError) {
      console.error("Error fetching ratings:", ratingsError);
    } else if (ratings && ratings.length > 0) {
      const totalRatings = ratings.length;
      const sumRatings = ratings.reduce((sum, r) => sum + (r.rating || 0), 0);
      const averageRating = sumRatings / totalRatings;

      // Update course rating
      await supabase
        .from("courses")
        .update({
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          total_ratings: totalRatings,
        })
        .eq("id", courseId);
    }

    return NextResponse.json({
      success: true,
      message: existingRating ? "Rating updated" : "Rating submitted",
      ratingId,
    });
  } catch (error: any) {
    console.error("Rate course error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit rating" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const supabase = createServerClient(request);

    // Try to get user - check Authorization header first, then session
    let user;
    const authHeader = request.headers.get("authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Token is in header - validate it directly
      const token = authHeader.substring(7);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          user = userData;
        }
      } catch (error) {
        console.error("Error validating token:", error);
      }
    }
    
    // Fallback to Supabase client methods
    if (!user) {
      const { data: { user: userFromToken }, error: userError } = await supabase.auth.getUser();
      if (userFromToken) {
        user = userFromToken;
      } else {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session?.user) {
          user = session.user;
        }
        
        if (userError) {
          console.error("User error in rate GET route:", userError);
        }
        if (sessionError) {
          console.error("Session error in rate GET route:", sessionError);
        }
      }
    }

    // Get user's rating if logged in
    let userRating = null;
    if (user) {
      const { data } = await supabase
        .from("course_ratings")
        .select("rating, comment")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();
      userRating = data;
    }

    return NextResponse.json({ userRating });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch rating" },
      { status: 500 }
    );
  }
}

