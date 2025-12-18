"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageSquare, Bookmark, Share2, BookmarkCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostActionsProps {
  postSlug: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  user_id: string;
  user_profiles: {
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export function PostActions({ postSlug }: PostActionsProps) {
  const { user } = useAuth();
  const [likes, setLikes] = useState({ count: 0, userLiked: false });
  const [saves, setSaves] = useState({ count: 0, userSaved: false });
  const [shares, setShares] = useState({ count: 0 });
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState({ likes: false, saves: false, comments: false, shares: false });
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchLikes();
    fetchSaves();
    fetchShares();
    fetchComments();
  }, [postSlug]);

  const fetchLikes = async () => {
    try {
      // Get access token to send with request
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/posts/${postSlug}/likes`, {
        credentials: "include",
        headers,
      });
      const data = await response.json();
      if (response.ok) {
        setLikes(data);
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    }
  };

  const fetchSaves = async () => {
    try {
      // Get access token to send with request
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/posts/${postSlug}/saves`, {
        credentials: "include",
        headers,
      });
      const data = await response.json();
      if (response.ok) {
        setSaves(data);
      }
    } catch (error) {
      console.error("Error fetching saves:", error);
    }
  };

  const fetchShares = async () => {
    try {
      const response = await fetch(`/api/posts/${postSlug}/shares`, {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setShares(data);
      }
    } catch (error) {
      console.error("Error fetching shares:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postSlug}/comments`, {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setComments(data.comments || []);
        setCommentsCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update - update UI immediately
    const wasLiked = likes.userLiked;
    const previousCount = likes.count;
    const newCount = wasLiked ? Math.max(0, previousCount - 1) : previousCount + 1;
    
    // Disable button immediately to prevent double-clicks
    setLoading((prev) => ({ ...prev, likes: true }));
    // Update UI state immediately for instant feedback (React batches these)
    setLikes({ count: newCount, userLiked: !wasLiked });

    try {
      // Get access token from Supabase session
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      const method = wasLiked ? "DELETE" : "POST";
      const response = await fetch(`/api/posts/${postSlug}/likes`, {
        method,
        credentials: "include",
        headers,
      });
      const data = await response.json();
      if (response.ok) {
        // Sync with server response
        setLikes({ count: data.count, userLiked: data.userLiked });
        // No toast for likes - instant feedback is enough
      } else {
        // Revert on error
        setLikes({ count: previousCount, userLiked: wasLiked });
        throw new Error(data.error);
      }
    } catch (error: any) {
      // Revert on error
      setLikes({ count: previousCount, userLiked: wasLiked });
      toast({
        title: "Error",
        description: error.message || "Failed to update like",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, likes: false }));
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save posts",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update - update UI immediately
    const wasSaved = saves.userSaved;
    const previousCount = saves.count;
    const newCount = wasSaved ? Math.max(0, previousCount - 1) : previousCount + 1;
    
    // Disable button immediately to prevent double-clicks
    setLoading((prev) => ({ ...prev, saves: true }));
    // Small delay to ensure button is disabled before UI update (prevents double-clicks)
    await new Promise(resolve => setTimeout(resolve, 10));
    // Update UI state immediately for instant feedback
    setSaves({ count: newCount, userSaved: !wasSaved });

    try {
      // Get access token from Supabase session
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      const method = wasSaved ? "DELETE" : "POST";
      const response = await fetch(`/api/posts/${postSlug}/saves`, {
        method,
        credentials: "include",
        headers,
      });
      const data = await response.json();
      if (response.ok) {
        // Sync with server response
        setSaves({ count: data.count, userSaved: data.userSaved });
        // Only show toast on success, not on every click
        if (data.userSaved !== wasSaved) {
          toast({
            title: data.userSaved ? "Saved" : "Unsaved",
            description: `Post ${data.userSaved ? "added to" : "removed from"} your saved posts`,
            variant: "success",
          });
        }
      } else {
        // Revert on error
        setSaves({ count: previousCount, userSaved: wasSaved });
        throw new Error(data.error);
      }
    } catch (error: any) {
      // Revert on error
      setSaves({ count: previousCount, userSaved: wasSaved });
      toast({
        title: "Error",
        description: error.message || "Failed to update save",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, saves: false }));
    }
  };

  const handleShare = async (platform: string) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = typeof document !== "undefined" ? document.title : "";

    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "copy":
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
          toast({
            title: "Copied!",
            description: "Link copied to clipboard",
            variant: "success",
          });
        }
        break;
    }

    if (shareUrl && platform !== "copy") {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }

    // Record share
    try {
      // Get access token from Supabase session
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      await fetch(`/api/posts/${postSlug}/shares`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ platform }),
      });
      fetchShares();
    } catch (error) {
      console.error("Error recording share:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setSubmittingComment(true);
    try {
      // Get access token from Supabase session
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/posts/${postSlug}/comments`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ content: newComment }),
      });
      const data = await response.json();
      if (response.ok) {
        setNewComment("");
        setCommentDialogOpen(false);
        fetchComments();
        toast({
          title: "Success",
          description: "Comment added successfully",
          variant: "success",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 flex-wrap gap-2">
      <Button
        variant="ghost"
        size="sm"
        className={`gap-2 transition-all duration-200 ${
          likes.userLiked 
            ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300" 
            : "hover:text-blue-600 dark:hover:text-blue-400"
        } ${loading.likes ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={handleLike}
        disabled={loading.likes}
      >
        <ThumbsUp className={`h-4 w-4 transition-all duration-200 ${
          likes.userLiked 
            ? "fill-current scale-110 text-blue-600 dark:text-blue-400" 
            : "hover:scale-110"
        } ${loading.likes ? "animate-pulse" : ""}`} />
        <span className={`font-medium transition-colors duration-200 ${
          likes.userLiked 
            ? "text-blue-600 dark:text-blue-400" 
            : ""
        }`}>
          {likes.count}
        </span>
        {loading.likes && (
          <span className="text-xs text-muted-foreground ml-1 animate-pulse">...</span>
        )}
      </Button>

      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageSquare className="h-4 w-4" /> {commentsCount}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              Share your thoughts about this post
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Comments List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user_profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {comment.user_profiles?.display_name?.[0] || comment.user_profiles?.email?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">
                          {comment.user_profiles?.display_name || comment.user_profiles?.email || "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), "MMM d, yyyy")}
                          {comment.is_edited && " (edited)"}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            {user ? (
              <div className="space-y-2 pt-4 border-t">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCommentDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitComment}
                    disabled={submittingComment || !newComment.trim()}
                  >
                    {submittingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Please sign in to comment
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/auth">Sign In</a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="ghost"
        size="sm"
        className={`gap-2 transition-all duration-200 ${
          saves.userSaved 
            ? "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300" 
            : "hover:text-green-600 dark:hover:text-green-400"
        } ${loading.saves ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={handleSave}
        disabled={loading.saves}
      >
        {saves.userSaved ? (
          <BookmarkCheck className="h-4 w-4 fill-current scale-110 transition-all duration-200 text-green-600 dark:text-green-400" />
        ) : (
          <Bookmark className={`h-4 w-4 transition-all duration-200 hover:scale-110 ${loading.saves ? "animate-pulse" : ""}`} />
        )}
        {saves.count > 0 && (
          <span className={`font-medium transition-colors duration-200 ${
            saves.userSaved 
              ? "text-green-600 dark:text-green-400" 
              : ""
          }`}>
            {saves.count}
          </span>
        )}
        <span className={`hidden sm:inline transition-colors duration-200 ${
          saves.userSaved 
            ? "text-green-600 dark:text-green-400 font-medium" 
            : ""
        }`}>
          {saves.userSaved ? "Saved" : "Save"}
        </span>
        {loading.saves && (
          <span className="text-xs text-muted-foreground ml-1 animate-pulse">...</span>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            {shares.count > 0 && <span>{shares.count}</span>}
            <span className="sr-only">Share</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleShare("twitter")}>
            Share on Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("facebook")}>
            Share on Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("linkedin")}>
            Share on LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("copy")}>
            Copy Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

