"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface EnrollmentCountProps {
  courseId: string;
  initialCount: number;
}

export function EnrollmentCount({ courseId, initialCount }: EnrollmentCountProps) {
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch updated enrollment count
    const fetchCount = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/courses/${courseId}/enrollment-count?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const newCount = data.count ?? 0;
          setCount(newCount);
        }
      } catch (error) {
        console.error("Error fetching enrollment count:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately on mount (with small delay to ensure page is ready)
    const initialTimeout = setTimeout(() => {
      fetchCount();
    }, 100);

    // Poll every 2 seconds for immediate updates
    const interval = setInterval(fetchCount, 2000);

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check sessionStorage every second for enrollment events
    const checkStorage = setInterval(() => {
      const key = `enrollment-${courseId}`;
      const value = sessionStorage.getItem(key);
      if (value) {
        fetchCount();
        sessionStorage.removeItem(key);
      }
    }, 1000);

    // Listen for custom enrollment events
    const handleEnrollment = () => {
      fetchCount();
    };
    window.addEventListener(`enrollment-${courseId}`, handleEnrollment);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      clearInterval(checkStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener(`enrollment-${courseId}`, handleEnrollment);
    };
  }, [courseId]);

  return (
    <div className="flex items-center gap-1.5">
      <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
      <span className="text-base sm:text-sm">
        {isLoading ? "..." : `${count} students`}
      </span>
    </div>
  );
}

