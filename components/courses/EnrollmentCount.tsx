"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface EnrollmentCountProps {
  courseId: string;
  initialCount: number;
}

export function EnrollmentCount({ courseId, initialCount }: EnrollmentCountProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    // Fetch count function
    const fetchCount = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/enrollment-count?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.count !== undefined) {
            setCount(data.count);
          }
        }
      } catch (error) {
        console.error("Error fetching enrollment count:", error);
      }
    };

    // Check sessionStorage once on mount (for immediate enrollment updates)
    const key = `enrollment-${courseId}`;
    const enrollmentTime = sessionStorage.getItem(key);
    if (enrollmentTime) {
      fetchCount();
      sessionStorage.removeItem(key);
    }

    // Only update when page becomes visible (user navigates back from learn page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCount();
      }
    };

    // Listen for custom enrollment events
    const handleEnrollment = () => {
      fetchCount();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener(`enrollment-${courseId}`, handleEnrollment);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener(`enrollment-${courseId}`, handleEnrollment);
    };
  }, [courseId]);

  return (
    <div className="flex items-center gap-1.5">
      <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
      <span className="text-base sm:text-sm">{count} students</span>
    </div>
  );
}

