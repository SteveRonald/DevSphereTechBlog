"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, User, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase";

interface CommentFormProps {
  postId: string;
  onCommentAdded: () => void;
}

export function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const { toast } = useToast();

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

    if (isGuest && (!guestName.trim() || !guestEmail.trim())) {
      toast({
        title: "Error",
        description: "Please provide your name and email",
        variant: "destructive",
      });
      return;
    }

    if (isGuest && !guestEmail.includes("@")) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const commentData: any = {
        post_id: postId,
        content: content.trim(),
      };

      if (user) {
        commentData.user_id = user.id;
      } else {
        commentData.guest_name = guestName.trim();
        commentData.guest_email = guestEmail.trim();
      }

      const { error } = await supabase
        .from("post_comments")
        .insert([commentData]);

      if (error) throw error;

      setContent("");
      setGuestName("");
      setGuestEmail("");
      
      toast({
        title: "Success",
        description: "Comment posted successfully",
      });

      onCommentAdded();
    } catch (error: any) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="userType"
                checked={!isGuest}
                onChange={() => setIsGuest(false)}
                className="text-primary"
              />
              <span className="text-sm font-medium">Sign in to comment</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="userType"
                checked={isGuest}
                onChange={() => setIsGuest(true)}
                className="text-primary"
              />
              <span className="text-sm font-medium">Comment as guest</span>
            </label>
          </div>

          {isGuest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name *
                </Label>
                <Input
                  id="guestName"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="John Doe"
                  required={isGuest}
                  className="border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email *
                </Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="john@example.com"
                  required={isGuest}
                  className="border-border/50 focus:border-primary"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comment">Comment *</Label>
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
      </CardContent>
    </Card>
  );
}