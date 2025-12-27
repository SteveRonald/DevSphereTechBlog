import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Path parameter is required" },
        { status: 400 }
      );
    }

    // Revalidate the specified path
    revalidatePath(path);

    return NextResponse.json({
      success: true,
      message: `Path ${path} revalidated successfully`,
      revalidated: true,
      now: Date.now(),
    });
  } catch (error: any) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revalidate" },
      { status: 500 }
    );
  }
}

