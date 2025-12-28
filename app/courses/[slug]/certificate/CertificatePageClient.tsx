"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CertificateActions } from "@/components/courses/CertificateActions";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import "./certificate.css";

interface CourseCertificatePageClientProps {
  slug: string;
  user: any;
}

export function CourseCertificatePageClient({ slug, user }: CourseCertificatePageClientProps) {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("id, title, slug, category, difficulty_level")
          .eq("slug", slug)
          .eq("is_published", true)
          .single();

        if (courseError || !courseData) {
          notFound();
          return;
        }

        setCourse(courseData);

        // Fetch enrollment with enrollment date
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from("user_course_enrollments")
          .select("*")
          .eq("user_id", user.id)
          .eq("course_id", courseData.id)
          .maybeSingle();

        // Check if enrollment exists
        if (enrollmentError) {
          console.error("Enrollment error:", enrollmentError);
          setError(enrollmentError.message || "Failed to load enrollment data. Please ensure you are enrolled in this course.");
          setLoading(false);
          return;
        }

        if (!enrollmentData) {
          setError("You are not enrolled in this course. Please enroll first to view your certificate.");
          setLoading(false);
          return;
        }

        setEnrollment(enrollmentData);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("display_name, first_name, last_name, email")
          .eq("id", user.id)
          .single();

        setProfile(profileData);

        // Check if profile is complete (needs at least display_name OR both first_name and last_name)
        const isProfileComplete = profileData && (
          (profileData.display_name && profileData.display_name.trim()) ||
          (profileData.first_name && profileData.first_name.trim() && profileData.last_name && profileData.last_name.trim())
        );

        setCheckingProfile(false);

        if (!isProfileComplete) {
          // Redirect to profile page with return URL
          const returnUrl = `/courses/${slug}/certificate`;
          router.push(`/profile?redirect=${encodeURIComponent(returnUrl)}&message=${encodeURIComponent("Please complete your profile to view your certificate. Your name is required for the certificate.")}`);
          return;
        }
      } catch (err) {
        setError("Failed to load certificate data");
      } finally {
        setLoading(false);
      }
    };

    if (user && slug) {
      fetchData();
    }
  }, [user, slug]);

  if (loading || checkingProfile) {
    return (
      <div className="container max-w-5xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container max-w-3xl mx-auto px-4 md:px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error || "Course not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!enrollment?.is_completed) {
    return (
      <div className="container max-w-3xl mx-auto px-4 md:px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Certificate Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Complete all lessons in <span className="font-medium text-foreground">{course.title}</span> to unlock your certificate.
            </p>
            <Button asChild>
              <a href={`/courses/${course.slug}/learn`}>Continue Learning</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (enrollment?.is_passed !== true) {
    return (
      <div className="container max-w-3xl mx-auto px-4 md:px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Certificate Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You completed <span className="font-medium text-foreground">{course.title}</span> but did not reach the passing mark.
            </p>
            <p className="text-sm text-muted-foreground">
              Final score: <span className="font-semibold text-foreground">{Number(enrollment?.final_score_100 || 0).toFixed(1)} / 100</span>
            </p>
            <Button asChild>
              <a href={`/courses/${course.slug}/retake-final-exam`}>Retake Final Exam</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const learnerName =
    (profile?.display_name && profile.display_name.trim()) ||
    ([profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim()) ||
    profile?.email ||
    user.email ||
    "Learner";

  const completedAt = enrollment.completed_at ? new Date(enrollment.completed_at) : new Date();
  const completionText = completedAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get current date for certificate issue date (when printing/downloading)
  const issueDateText = currentDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get enrollment start date (when user actually enrolled)
  // Use enrolled_at if available, otherwise fall back to created_at
  const enrollmentDate = enrollment.enrolled_at || enrollment.created_at;
  const startedAt = enrollmentDate ? new Date(enrollmentDate) : new Date();
  const startDateText = startedAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Certificate award date is the completion date (when student was awarded certificate)
  // Use completed_at if available, otherwise use current date
  const awardDate = enrollment.completed_at ? new Date(enrollment.completed_at) : currentDate;
  const awardDateText = awardDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container max-w-5xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-center justify-between gap-4 mb-6 no-print">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Certificate</h1>
          <p className="text-sm text-muted-foreground">Print or save this certificate for your records.</p>
        </div>
        <CertificateActions />
      </div>

      <div className="certificate-container relative">
        <div className="certificate-border"></div>
        
        <div className="relative h-full flex flex-col">
          {/* Certificate Header */}
          <div className="certificate-header">
            <div className="certificate-logo">
              <img src="/logo.png" alt="CodeCraft Academy Logo" className="logo-theme-optimized" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }} />
              <div>
                <h2 className="certificate-title">CodeCraft Academy</h2>
                <p className="certificate-subtitle">Certificate of Completion</p>
              </div>
            </div>
            <div className="certificate-badges">
              {course.category && <span className="certificate-badge">{course.category}</span>}
              {course.difficulty_level && <span className="certificate-badge">{course.difficulty_level}</span>}
            </div>
          </div>

          {/* Certificate Body */}
          <div className="certificate-body">
            <p className="certificate-certifies">This certifies that</p>
            <h3 className="certificate-student-name">{learnerName}</h3>
            <p className="certificate-course-text">has successfully completed the course</p>
            <h4 className="certificate-course-name">{course.title}</h4>
            <div className="certificate-date">
              <p>Course Period</p>
              <p className="certificate-date-value">{startDateText} - {awardDateText}</p>
            </div>
          </div>

          {/* Certificate Footer */}
          <div className="certificate-footer">
            <div className="certificate-id">
              <p className="certificate-id-label">Certificate ID</p>
              <p className="certificate-id-value">{user.id.slice(0, 8)}-{course.id.slice(0, 8)}</p>
            </div>
            <div className="certificate-verify">
              <div className="certificate-verified-badge">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="8" fill="#3b82f6"/>
                  <path d="M6 9L8 11L12 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Verified</span>
              </div>
              <p className="certificate-verify-label">Verify</p>
              <p className="certificate-verify-value">codecraftacademy.com</p>
            </div>
          </div>

          {/* Signature Section */}
          <div className="certificate-signature">
            <div className="certificate-signature-block">
              <p className="certificate-signature-title">Director of CodeCraft Academy</p>
              <div className="certificate-signature-line"></div>
              <p className="certificate-signature-name">Steve Ronald</p>
            </div>
            <div className="certificate-signature-block">
              <p className="certificate-signature-title">Date Issued</p>
              <div className="certificate-signature-line"></div>
              <p className="certificate-signature-date">{issueDateText}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center no-print">
        <Button variant="outline" asChild>
          <a href={`/courses/${course.slug}`}>Back to Course</a>
        </Button>
      </div>
    </div>
  );
}
