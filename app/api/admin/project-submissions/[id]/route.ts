import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase-admin";
import { sendEmail } from "@/lib/email";
import { shouldSendReviewNotification } from "@/lib/email-helpers";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const admin = createAdminClient();

    const { data: submission, error } = await admin
      .from("lesson_project_submissions")
      .select("id,user_id,course_id,lesson_id,submission_text,submission_url,attachment_urls,status,feedback,created_at,updated_at")
      .eq("id", params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const [{ data: lesson }, { data: student }] = await Promise.all([
      admin.from("lessons").select("id,title").eq("id", submission.lesson_id).single(),
      admin
        .from("user_profiles")
        .select("id,email,display_name,first_name,last_name")
        .eq("id", submission.user_id)
        .single(),
    ]);

    return NextResponse.json({
      submission,
      lesson: lesson ? { id: (lesson as any).id, title: (lesson as any).title } : null,
      student: (student as any) || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const body = (await request.json()) as {
      status?: "approved" | "rejected";
      feedback?: string;
    };

    if (body?.status !== "approved" && body?.status !== "rejected") {
      return NextResponse.json({ error: "status must be approved or rejected" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: existing, error: loadError } = await admin
      .from("lesson_project_submissions")
      .select("id,user_id,course_id,lesson_id")
      .eq("id", params.id)
      .single();

    if (loadError) {
      return NextResponse.json({ error: loadError.message }, { status: 400 });
    }

    const nextFeedback = typeof body.feedback === "string" ? body.feedback : null;

    const { data, error } = await admin
      .from("lesson_project_submissions")
      .update({
        status: body.status,
        feedback: nextFeedback,
        reviewer_id: gate.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select("id,status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (body.status === "approved") {
      await admin.from("user_lesson_completion").upsert(
        {
          user_id: existing.user_id,
          lesson_id: existing.lesson_id,
          course_id: existing.course_id,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      );
    }

    // Best-effort email to student (do not fail review if email fails)
    // Check if notifications are enabled before sending
    try {
      const shouldSend = await shouldSendReviewNotification();
      if (!shouldSend) {
        // Notifications disabled, skip email
        return NextResponse.json({ submission: data });
      }

      const [{ data: student }, { data: lesson }, { data: course }] = await Promise.all([
        admin
          .from("user_profiles")
          .select("email")
          .eq("id", existing.user_id)
          .single(),
        admin
          .from("lessons")
          .select("title")
          .eq("id", existing.lesson_id)
          .single(),
        admin
          .from("courses")
          .select("slug, title")
          .eq("id", existing.course_id)
          .single(),
      ]);

      const to = (student as any)?.email;
      if (typeof to === "string" && to.trim()) {
        const lessonTitle = (lesson as any)?.title || "Project";
        const courseSlug = (course as any)?.slug;
        const courseTitle = (course as any)?.title || "Course";
        const decision = body.status === "approved" ? "Approved" : "Rejected";
        const decisionColor = body.status === "approved" ? "#10b981" : "#ef4444";
        const feedbackLine = nextFeedback ? `<p style="margin: 12px 0 0 0; color: #4b5563;"><strong>Feedback:</strong><br/>${String(nextFeedback).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : "";
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
        
        // Build course-specific URL
        const courseUrl = courseSlug && siteUrl 
          ? `${siteUrl}/courses/${courseSlug}/learn`
          : siteUrl || "";
        
        const continueLink = courseUrl 
          ? `<p style="margin: 16px 0 0 0;">Continue learning: <a href="${courseUrl}" style="color: #4f46e5; text-decoration: underline;">${courseTitle}</a></p>`
          : siteUrl 
          ? `<p style="margin: 16px 0 0 0;">Continue learning: <a href="${siteUrl}" style="color: #4f46e5; text-decoration: underline;">${siteUrl}</a></p>`
          : "";

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
            <h2 style="margin: 0 0 12px 0; color: #111827;">Your project review is complete</h2>
            <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>Course:</strong> ${courseTitle}</p>
            <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>Lesson:</strong> ${lessonTitle}</p>
            <p style="margin: 0 0 8px 0; color: #111827;"><strong>Status:</strong> <span style="color: ${decisionColor}; font-weight: 600;">${decision}</span></p>
            ${feedbackLine}
            ${continueLink}
          </div>
        `;
        const text = `Your project review is complete\n\nCourse: ${courseTitle}\nLesson: ${lessonTitle}\nStatus: ${decision}${nextFeedback ? `\nFeedback: ${nextFeedback}` : ""}${courseUrl ? `\n\nContinue learning: ${courseUrl}` : ""}`;
        await sendEmail({ to, subject: "Project review completed - CodeCraft Academy", html, text });
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ submission: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
