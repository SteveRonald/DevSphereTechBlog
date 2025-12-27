import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// POST: Upload file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const purpose = (formData.get("purpose") as string | null) || "thumbnail";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isResource = purpose === "resource";

    // Validate file type
    const thumbnailTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    const resourceTypes = [
      ...thumbnailTypes,
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/markdown",
    ];
    const validTypes = isResource ? resourceTypes : thumbnailTypes;
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: isResource ? "Invalid file type for resource." : "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = isResource ? 25 * 1024 * 1024 : 5 * 1024 * 1024; // 25MB resources, 5MB thumbnails
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size too large. Maximum size is ${isResource ? "25MB" : "5MB"}.` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = isResource ? `course-resources/${fileName}` : `course-thumbnails/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("course-assets")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("course-assets")
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}









