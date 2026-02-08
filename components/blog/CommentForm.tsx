"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface CommentFormProps {
  postSlug: string;
  onCommentAdded: () => void;
}

export function CommentForm({ postSlug, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { toast } = useToast();

  // Check if user is signed in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsSignedIn(true);
        }
      } catch {
        // Not signed in
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Not signed in",
          description: "Please sign in first to comment.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (session.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/posts/${encodeURIComponent(postSlug)}/comments`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to post comment");
      }

      setContent("");
      toast({
        title: "Success",
        description: "Comment posted successfully!",
      });

      onCommentAdded();
    } catch (error: any) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-primary" />
          Leave a Comment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isSignedIn ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-muted-foreground">Sign in to leave a comment on this post.</p>
            <Link href="/auth">
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Comment
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                id="comment"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts on this article..."
                rows={4}
                required
                className="border-border/50 focus:border-primary resize-none"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? "Posting..." : "Post Comment"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}