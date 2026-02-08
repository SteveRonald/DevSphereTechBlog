"use client";

import { useState } from "react";
import { CommentForm } from "./CommentForm";
import { CommentsList } from "./CommentsList";

interface CommentSectionProps {
  postId?: string;
  postSlug: string;
}

export function CommentSection({ postSlug }: CommentSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCommentAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      <CommentsList postSlug={postSlug} />
      <CommentForm postSlug={postSlug} onCommentAdded={handleCommentAdded} />
    </div>
  );
}
