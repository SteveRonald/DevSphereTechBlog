"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
  conversationId?: string;
  onRate?: (conversationId: string, rating: number) => void;
  rating?: number;
  imageUrl?: string; // For displaying images in chat
}

export function ChatMessage({ 
  role, 
  content, 
  isTyping, 
  conversationId, 
  onRate,
  rating,
  imageUrl
}: ChatMessageProps) {
  const isUser = role === "user";
  const { toast } = useToast();

  const handleRate = (rate: number) => {
    if (conversationId && onRate) {
      onRate(conversationId, rate);
      // Show feedback toast
      if (rate === 5) {
        toast({
          title: "Thank you!",
          description: "We're glad this response was helpful. Your feedback helps us improve!",
          variant: "success",
        });
      } else if (rate === 1) {
        toast({
          title: "Thanks for your feedback",
          description: "We're sorry this wasn't helpful. We'll use your feedback to improve our responses.",
        });
      }
    }
  };

  // Function to parse URLs and make them clickable
  const formatMessage = (text: string) => {
    // Regex to match URLs (http:// or https:// followed by non-whitespace)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts: Array<{ text: string; isUrl: boolean }> = [];
    let lastIndex = 0;
    let match;
    
    // Find all URLs and their positions
    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before URL
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), isUrl: false });
      }
      // Add URL
      parts.push({ text: match[0], isUrl: true });
      lastIndex = urlRegex.lastIndex;
    }
    
    // Add remaining text after last URL
    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), isUrl: false });
    }
    
    // If no URLs found, return original text
    if (parts.length === 0) {
      return <span>{text}</span>;
    }
    
    return parts.map((part, index) => {
      if (part.isUrl) {
        return (
          <Link
            key={index}
            href={part.text}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "underline hover:opacity-80 break-all",
              isUser 
                ? "text-primary-foreground/90" 
                : "text-primary"
            )}
          >
            {part.text}
          </Link>
        );
      }
      return <span key={index}>{part.text}</span>;
    });
  };

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className={cn("h-9 w-9 flex-shrink-0 mt-0.5", isUser && "ml-auto")}>
        <AvatarFallback
          className={cn(
            isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
          )}
        >
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        "flex flex-col space-y-2 max-w-[85%]",
        isUser ? "items-end" : "items-start"
      )}>
        <p className={cn(
          "text-xs font-medium mb-0.5",
          isUser ? "text-right" : "text-left"
        )}>
          {isUser ? "You" : "CodeCraft Assistant"}
        </p>
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-sm leading-relaxed",
            "break-words",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {isTyping ? (
            <div className="flex gap-1.5">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
                .
              </span>
              <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                .
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Display image if present */}
              {imageUrl && (
                <div className="mb-2">
                  <img
                    src={imageUrl}
                    alt="Uploaded image"
                    className="max-w-full max-h-[300px] rounded-lg border border-border/50 object-contain"
                  />
                </div>
              )}
              <div className="whitespace-pre-wrap leading-6">
                {formatMessage(content)}
              </div>
            </div>
          )}
        </div>
        {/* Rating buttons for assistant messages */}
        {!isUser && !isTyping && conversationId && (
          <div className="flex gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRate(5)}
              className={cn(
                "h-6 px-2 text-xs",
                rating === 5 && "bg-green-500/20 text-green-600 dark:text-green-400"
              )}
              title="Helpful"
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRate(1)}
              className={cn(
                "h-6 px-2 text-xs",
                rating === 1 && "bg-red-500/20 text-red-600 dark:text-red-400"
              )}
              title="Not helpful"
            >
              <ThumbsDown className="h-3 w-3 mr-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

