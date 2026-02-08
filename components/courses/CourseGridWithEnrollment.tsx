"use client";

import { useState, useEffect } from "react";
import { CourseCard, type Course } from "./CourseCard";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";

interface CourseGridWithEnrollmentProps {
  courses: Course[];
}

export function CourseGridWithEnrollment({ courses }: CourseGridWithEnrollmentProps) {
  const { user } = useAuth();
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;

    const fetchEnrollments = async () => {
      try {
        const supabase = createClient();
        const { data: enrollments } = await supabase
          .from("user_course_enrollments")
          .select("course_id, is_completed")
          .eq("user_id", user.id);

        if (enrollments) {
          setEnrolledCourseIds(new Set(enrollments.map((e: { course_id: string }) => e.course_id)));

          const progressMap: Record<string, number> = {};
          for (const enrollment of enrollments) {
            const { count: totalLessons } = await supabase
              .from("lessons")
              .select("*", { count: "exact", head: true })
              .eq("course_id", enrollment.course_id)
              .eq("is_published", true);

            const { count: completedLessons } = await supabase
              .from("user_lesson_completion")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("course_id", enrollment.course_id);

            if (totalLessons && totalLessons > 0) {
              progressMap[enrollment.course_id] = Math.round(
                ((completedLessons || 0) / totalLessons) * 100
              );
            }
          }
          setCourseProgress(progressMap);
        }
      } catch (error) {
        console.error("Error fetching enrollments:", error);
      }
    };

    fetchEnrollments();
  }, [user]);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          enrolled={enrolledCourseIds.has(course.id)}
          progress={courseProgress[course.id] || 0}
        />
      ))}
    </div>
  );
}
