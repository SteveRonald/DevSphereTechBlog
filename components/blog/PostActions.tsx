"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase";

interface PostActionsProps {
  postSlug: string;
}

export function PostActions({ postSlug }: PostActionsProps) {
  const [likes, setLikes] = useState(42); // Mock data for now
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLike = async () => {
    if (isLiked) {
      setIsLiked(false);
      setLikes(prev => Math.max(0, prev - 1));
      toast({
        title: "Like removed",
        description: "You've removed your like",
      });
    } else {
      setIsLiked(true);
      setLikes(prev => prev + 1);
      toast({
        title: "Post liked!",
        description: "Thanks for your support ",
      });
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/blog/${postSlug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this post from CodeCraft Academy",
          text: "Amazing tech content that will help you grow!",
          url: url,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied! 📋",
          description: "Post link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Could not copy link to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const handleBookmark = async () => {
    if (isBookmarked) {
      setIsBookmarked(false);
      toast({
        title: "Bookmark removed",
        description: "Post removed from your bookmarks",
      });
    } else {
      setIsBookmarked(true);
      toast({
        title: "Post bookmarked! 🔖",
        description: "Saved to your bookmarks for later",
      });
    }
  };

  const scrollToComments = () => {
    const commentsSection = document.getElementById("comments-section");
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-20 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-around gap-2">
          {/* Like Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={loading}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
              isLiked 
                ? "text-red-500 hover:bg-red-50 hover:text-red-600" 
                : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
            }`}
          >
            <Heart 
              className={`h-6 w-6 transition-all duration-300 ${
                isLiked ? "fill-current scale-110 animate-pulse" : "hover:scale-110"
              }`} 
            />
            <span className="text-xs font-semibold">
              {likes}
            </span>
            <span className="text-xs">Like</span>
          </Button>

          {/* Comment Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollToComments}
            className="flex flex-col items-center gap-1 p-3 rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all duration-200 hover:scale-105"
          >
            <MessageCircle className="h-6 w-6 hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">∞</span>
            <span className="text-xs">Comment</span>
          </Button>

          {/* Share Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex flex-col items-center gap-1 p-3 rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all duration-200 hover:scale-105"
          >
            <Share2 className="h-6 w-6 hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Share</span>
          </Button>

          {/* Bookmark Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
              isBookmarked 
                ? "text-blue-500 hover:bg-blue-50 hover:text-blue-600" 
                : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
            }`}
          >
            <Bookmark 
              className={`h-6 w-6 transition-all duration-300 ${
                isBookmarked ? "fill-current scale-110" : "hover:scale-110"
              }`} 
            />
            <span className="text-xs font-semibold">Save</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
