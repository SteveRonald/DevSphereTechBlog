"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CourseRatingProps {
  courseId: string;
  courseSlug: string;
  currentRating: number;
  totalRatings: number;
}

export function CourseRating({
  courseId,
  courseSlug,
  currentRating,
  totalRatings,
}: CourseRatingProps) {
  const { user } = useAuth();
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    if (user && courseId) {
      fetchUserRating();
    } else {
      setLoading(false);
    }
  }, [user, courseId]);

  const fetchUserRating = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/courses/${courseId}/rate`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();
      if (data.userRating) {
        setSelectedRating(data.userRating.rating);
        setComment(data.userRating.comment || "");
        setHasRated(true);
      }
    } catch (error) {
      console.error("Error fetching user rating:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to rate this course",
        variant: "destructive",
      });
      return;
    }
    setSelectedRating(rating);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to rate this course",
        variant: "destructive",
      });
      return;
    }

    if (selectedRating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/courses/${courseId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          rating: selectedRating,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit rating");
      }

      toast({
        title: "Success",
        description: hasRated
          ? "Your rating has been updated"
          : "Thank you for rating this course!",
      });

      setHasRated(true);
      // Reload page to show updated rating
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Rate this Course</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to rate this course
            </p>
            <Button asChild>
              <a href={`/auth?redirect=/courses/${courseSlug}`}>Sign In</a>
            </Button>
          </div>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Your Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const displayRating = hoveredStar || selectedRating;
                  const isFilled = star <= displayRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(null)}
                      className={cn(
                        "transition-colors p-1 rounded",
                        isFilled
                          ? "text-yellow-400"
                          : "text-muted-foreground hover:text-yellow-400/50"
                      )}
                    >
                      <Star
                        className={cn(
                          "h-6 w-6 transition-all",
                          isFilled && "fill-current"
                        )}
                      />
                    </button>
                  );
                })}
                {selectedRating > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    {selectedRating} / 5
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="rating-comment" className="text-sm font-medium mb-2 block">
                Your Review (Optional)
              </label>
              <Textarea
                id="rating-comment"
                placeholder="Share your thoughts about this course..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || selectedRating === 0}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : hasRated ? (
                "Update Rating"
              ) : (
                "Submit Rating"
              )}
            </Button>

            {hasRated && (
              <p className="text-xs text-muted-foreground text-center">
                You can update your rating anytime
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

