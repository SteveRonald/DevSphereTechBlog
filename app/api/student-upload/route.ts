import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient(request);

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const {
      data: { user },
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const lessonId = (formData.get("lesson_id") as string | null) || "";
    const purpose = (formData.get("purpose") as string | null) || "submission";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!lessonId.trim()) {
      return NextResponse.json({ error: "lesson_id is required" }, { status: 400 });
    }

    const allowedPurposes = new Set(["quiz_answer", "project_answer", "submission"]);
    if (!allowedPurposes.has(purpose)) {
      return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "application/zip", "application/x-zip-compressed", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size too large. Maximum size is 10MB." }, { status: 400 });
    }

    const admin = createAdminClient();

    const fileExt = file.name.split(".").pop() || "bin";
    const safeExt = fileExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "bin";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
    const filePath = `submissions/${purpose}/${user.id}/${lessonId}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await admin.storage.from("course-assets").upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message || "Failed to upload" }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from("course-assets").getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
      mime: file.type,
      size: file.size,
      name: file.name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to upload" }, { status: 500 });
  }
}
