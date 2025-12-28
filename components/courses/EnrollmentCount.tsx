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
        const response = await fetch(`/api/courses/${courseId}/enrollment-count`, {
          cache: 'no-store', // Always fetch fresh data
        });
        
        if (response.ok) {
          const data = await response.json();
          setCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching enrollment count:", error);
        // Keep the initial count on error
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchCount();

    // Set up polling to refresh count every 10 seconds
    const interval = setInterval(fetchCount, 10000);

    // Refresh when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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

