"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send, Volume2, VolumeX, Loader2, LogIn, UserPlus, History, Plus, Trash2, Image as ImageIcon, XCircle } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { VoiceInput } from "./VoiceInput";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  conversationId?: string;
  rating?: number;
  imageUrl?: string; // For displaying images in chat
}

export function Chatbot() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    // Generate or retrieve session ID - use localStorage to persist across refreshes
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("chat_session_id");
      if (!id) {
        id = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        localStorage.setItem("chat_session_id", id);
      }
      return id;
    }
    return `session_${Date.now()}`;
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your CodeCraft Academy assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [chatLimit, setChatLimit] = useState(10);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [deletedSessions, setDeletedSessions] = useState<Set<string>>(() => {
    // Load deleted sessions from localStorage to persist across refreshes
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("deleted_chat_sessions");
      if (stored) {
        try {
          return new Set(JSON.parse(stored));
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });
  const [imageUploadCount, setImageUploadCount] = useState(0);
  const [imageUploadLimit, setImageUploadLimit] = useState<number | null>(null);
  const [imageLimitReached, setImageLimitReached] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const welcomeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show welcome popup after 2 seconds on first visit
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const hasSeenWelcome = localStorage.getItem("chat_welcome_seen");
    if (!hasSeenWelcome && !isOpen) {
      welcomeTimeoutRef.current = setTimeout(() => {
        setShowWelcomePopup(true);
        localStorage.setItem("chat_welcome_seen", "true");
      }, 2000);
    }

    return () => {
      if (welcomeTimeoutRef.current) {
        clearTimeout(welcomeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset limit when user logs in and load deleted sessions
  useEffect(() => {
    if (user) {
      setIsLimitReached(false);
      // Reset chat count display for logged-in users
      setChatCount(0);
      // Load deleted sessions from localStorage
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("deleted_chat_sessions");
        if (stored) {
          try {
            const deletedArray = JSON.parse(stored);
            setDeletedSessions(new Set(deletedArray));
          } catch {
            // Ignore parse errors
          }
        }
      }
      // Load conversation history for logged-in users
      loadConversationHistory();
    }
  }, [user]);

  // Load conversation history for logged-in users
  const loadConversationHistory = async () => {
    if (!user) return;
    
    try {
      // Get access token to send with request
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch("/api/chat/conversations", {
        credentials: "include",
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter out deleted sessions (from both state and localStorage)
        const filtered = data.sessions.filter((s: any) => !deletedSessions.has(s.sessionId));
        setConversationHistory(filtered);
      }
    } catch (error) {
      console.error("Error loading conversation history:", error);
    }
  };


  // Start a new chat session
  const startNewChat = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem("chat_session_id", newSessionId);
    setSessionId(newSessionId);
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm your CodeCraft Academy assistant. How can I help you today?",
      },
    ]);
    setInput("");
    setShowHistory(false);
  };

  // Load a conversation from history
  const loadConversation = (session: any) => {
    const conversationMessages: Message[] = [];
    session.conversations.forEach((conv: any) => {
      conversationMessages.push({ role: "user" as const, content: conv.user_question });
      conversationMessages.push({ 
        role: "assistant" as const, 
        content: conv.ai_response,
        conversationId: conv.id 
      });
    });
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm your CodeCraft Academy assistant. How can I help you today?",
      },
      ...conversationMessages,
    ]);
    setShowHistory(false);
  };

  // Delete conversation (frontend only)
  const deleteConversation = (deletedSessionId: string) => {
    const newDeletedSessions = new Set([...deletedSessions, deletedSessionId]);
    setDeletedSessions(newDeletedSessions);
    // Persist to localStorage so it never shows again
    if (typeof window !== "undefined") {
      localStorage.setItem("deleted_chat_sessions", JSON.stringify(Array.from(newDeletedSessions)));
    }
    setConversationHistory((prev) => prev.filter((s) => s.sessionId !== deletedSessionId));
    // If current session is deleted, start new chat
    if (deletedSessionId === sessionId) {
      startNewChat();
    }
  };

  // Handle image selection - DISABLED: Coming soon
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle image upload and analysis
  const handleImageUpload = async () => {
    if (!selectedImage) return;

    setUploadingImage(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        // Get access token to send with request
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        
        // Send image to API for analysis
        const response = await fetch("/api/chat/image", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            image: base64Image,
            description: imageDescription.trim() || undefined, // Send description if provided
            sessionId: sessionId,
            imageType: selectedImage.type, // Send image MIME type
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // Handle daily limit reached
          if (response.status === 429 && errorData.error === "daily_limit_reached") {
            setImageLimitReached(true);
            setImageUploadCount(errorData.count || 0);
            setImageUploadLimit(errorData.limit || null);
            const limitMessage: Message = {
              role: "assistant",
              content: errorData.message || "You've reached your daily image upload limit. You can still use text or voice input to continue chatting.",
            };
            setMessages((prev) => [...prev, limitMessage]);
            // Clear image
            setSelectedImage(null);
            setImagePreview(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            setUploadingImage(false);
            return;
          }
          
          throw new Error(errorData.message || "Failed to analyze image");
        }

        const data = await response.json();
        
        // Update image upload count and limit
        if (data.imageCount !== undefined && data.imageCount !== null) {
          setImageUploadCount(data.imageCount);
        }
        if (data.imageLimit !== undefined && data.imageLimit !== null) {
          setImageUploadLimit(data.imageLimit);
          // Check if limit reached
          if (data.imageCount >= data.imageLimit) {
            setImageLimitReached(true);
          } else {
            setImageLimitReached(false);
          }
        }
        
        // Add user message with image and description
        const userMessageContent = imageDescription.trim() 
          ? imageDescription
          : "Please analyze this image";
        const userMessage: Message = { 
          role: "user", 
          content: userMessageContent,
          imageUrl: imagePreview || undefined // Store image URL to display in chat
        };
        setMessages((prev) => [...prev, userMessage]);

        // Add assistant response
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response || "I've analyzed your image. How can I help you with it?",
          conversationId: data.conversationId,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Reload conversation history for logged-in users after uploading image
        if (user && data.conversationId) {
          loadConversationHistory();
        }

        // Clear image and description
        setSelectedImage(null);
        setImagePreview(null);
        setImageDescription("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(selectedImage);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: error.message || "Sorry, I couldn't analyze the image. Please make sure it's related to our website content.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setUploadingImage(false);
    }
  };

  // Check current chat limit on mount to sync with backend
  useEffect(() => {
    if (typeof window === "undefined" || user) return; // Skip for logged-in users
    
    // Check current limit by making a lightweight request
    const checkLimit = async () => {
      try {
        // We'll check the limit by attempting to get usage info
        // Since we can't directly query, we'll rely on the first API response
        // But we can at least ensure the session ID is persisted
        const storedCount = localStorage.getItem(`chat_count_${sessionId}`);
        const storedLimit = localStorage.getItem(`chat_limit_${sessionId}`);
        const storedLimitReached = localStorage.getItem(`limit_reached_${sessionId}`);
        
        if (storedCount) {
          setChatCount(parseInt(storedCount, 10));
        }
        if (storedLimit) {
          setChatLimit(parseInt(storedLimit, 10));
        }
        if (storedLimitReached === "true") {
          setIsLimitReached(true);
        }
      } catch (error) {
        console.error("Error checking chat limit:", error);
      }
    };
    
    checkLimit();
  }, [sessionId, user]);

  // Text-to-speech for responses
  const speak = (text: string) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
    // Auto-send after voice input
    setTimeout(() => {
      handleSend(transcript);
    }, 100);
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;
    
    // Prevent sending if limit is reached (check both state and localStorage)
    if (!user && isLimitReached) {
      return;
    }
    
    // Double-check localStorage in case state is out of sync
    if (!user) {
      const storedLimitReached = localStorage.getItem(`limit_reached_${sessionId}`);
      if (storedLimitReached === "true") {
        setIsLimitReached(true);
        return;
      }
    }

    // Add user message
    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history
      const conversationHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get access token to send with request
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: conversationHistory.slice(0, -1), // Exclude current message
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle chat limit reached
        if (response.status === 429 && errorData.error === "chat_limit_reached") {
          setIsLimitReached(true);
          const count = errorData.count || 0;
          const limit = errorData.limit || 10;
          setChatCount(count);
          setChatLimit(limit);
          // Persist to localStorage to survive page refreshes
          localStorage.setItem(`chat_count_${sessionId}`, count.toString());
          localStorage.setItem(`chat_limit_${sessionId}`, limit.toString());
          localStorage.setItem(`limit_reached_${sessionId}`, "true");
          const limitMessage: Message = {
            role: "assistant",
            content: `${errorData.message}\n\nSign in or create an account to continue chatting with unlimited access.`,
            conversationId: undefined,
          };
          setMessages((prev) => [...prev, limitMessage]);
          return; // Stop here, don't continue
        }
        
        throw new Error(errorData.message || "Failed to get response");
      }

      const data = await response.json();
      
      // Update chat count and limit from response
      if (data.chatCount !== undefined && data.chatCount !== null) {
        setChatCount(data.chatCount);
        // Persist to localStorage to survive page refreshes
        localStorage.setItem(`chat_count_${sessionId}`, data.chatCount.toString());
      }
      if (data.chatLimit !== undefined && data.chatLimit !== null) {
        setChatLimit(data.chatLimit);
        localStorage.setItem(`chat_limit_${sessionId}`, data.chatLimit.toString());
      }
      if (data.isLoggedIn) {
        setIsLimitReached(false); // Logged in users have unlimited access
        // Clear stored limit data for logged-in users
        localStorage.removeItem(`chat_count_${sessionId}`);
        localStorage.removeItem(`chat_limit_${sessionId}`);
        localStorage.removeItem(`limit_reached_${sessionId}`);
      } else if (data.chatCount >= data.chatLimit) {
        setIsLimitReached(true);
        localStorage.setItem(`limit_reached_${sessionId}`, "true");
      } else {
        localStorage.removeItem(`limit_reached_${sessionId}`);
      }
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "I'm sorry, I couldn't process that.",
        conversationId: data.conversationId,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Reload conversation history for logged-in users after sending a message
      // This ensures new chats appear in history immediately
      if (user && data.conversationId) {
        loadConversationHistory();
      }

      // Speak the response if voice is enabled
      if (voiceEnabled) {
        speak(assistantMessage.content);
      }
      } catch (error: any) {
        console.error("Chat error:", error);
        const errorMessage: Message = {
          role: "assistant",
          content: error.message || "Sorry, I'm having trouble right now. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Don't handle Enter if an image is selected (let image upload handle it)
    if (e.key === "Enter" && !e.shiftKey && !selectedImage) {
      e.preventDefault();
      if (!isLimitReached || user) {
      handleSend();
      }
    }
  };

  // Check if we should show auth buttons
  // Show when: limit reached, approaching limit (7+ chats), or assistant mentions auth
  const shouldShowAuthButtons = isLimitReached || 
    (!user && chatCount >= 7) ||
    messages.some((msg) => 
      msg.role === "assistant" && 
      (msg.content.toLowerCase().includes("sign in") || 
       msg.content.toLowerCase().includes("sign up") ||
       msg.content.toLowerCase().includes("create an account") ||
       msg.content.toLowerCase().includes("register") ||
       msg.content.toLowerCase().includes("reached the limit") ||
       msg.content.toLowerCase().includes("login") ||
       msg.content.toLowerCase().includes("unlimited access"))
    );

  // Determine if input should be disabled
  const isInputDisabled = isLoading || (isLimitReached && !user);

  const handleRate = async (conversationId: string, rating: number) => {
    try {
      const response = await fetch("/api/chat/rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          rating,
        }),
      });

      if (response.ok) {
        // Update the message with rating
        setMessages((prev) =>
          prev.map((msg) =>
            msg.conversationId === conversationId
              ? { ...msg, rating }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error rating conversation:", error);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          {/* Welcome Popup - appears from chatbot icon */}
          {showWelcomePopup && (
            <div className="absolute bottom-full right-0 mb-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
              <div className="bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-xl max-w-xs relative">
                <div className="absolute bottom-0 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-primary transform translate-y-full" />
                <p className="font-medium mb-2">Let's chat! 💬</p>
                <p className="text-sm opacity-90 mb-3">I can help you find blog posts, answer questions, and more.</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowWelcomePopup(false);
                      setIsOpen(true);
                    }}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                  >
                    Start Chat
                  </Button>
                  <Button
                    onClick={() => setShowWelcomePopup(false)}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    Maybe later
                  </Button>
                </div>
              </div>
            </div>
          )}
          {/* Pulsing outer ring */}
          <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping" style={{ animationDuration: '2s' }} />
          {/* Pulsing middle ring */}
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          <Button
            onClick={() => {
              setShowWelcomePopup(false);
              setIsOpen(true);
            }}
            className="relative h-14 w-14 rounded-full shadow-2xl hover:shadow-3xl transition-all bg-primary hover:bg-primary/90 hover:scale-110 animate-pulse"
            style={{ animationDuration: '2s' }}
            size="icon"
            aria-label="Open chat"
            onMouseEnter={(e) => {
              e.currentTarget.classList.remove('animate-pulse');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.classList.add('animate-pulse');
            }}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </Button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "fixed bottom-6 right-6 h-[600px] flex flex-col shadow-2xl z-50 border-2",
          user && showHistory ? "w-[90vw] max-w-2xl" : "w-[90vw] max-w-md"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <h3 className="font-semibold">CodeCraft Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHistory(!showHistory)}
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    title="Conversation history"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={startNewChat}
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    title="New chat"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setVoiceEnabled(!voiceEnabled);
                }}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                title={voiceEnabled ? "Disable voice" : "Enable voice output"}
              >
                {voiceEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setIsOpen(false);
                }}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Conversation History Sidebar */}
          {user && showHistory && (
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-background border-r z-10 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Conversations</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHistory(false)}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNewChat}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  New Chat
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {conversationHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center p-4">
                    No previous conversations
                  </p>
                ) : (
                  conversationHistory.map((session) => (
                    <div
                      key={session.sessionId}
                      className="p-3 mb-2 rounded-lg border hover:bg-muted cursor-pointer group relative"
                      onClick={() => loadConversation(session)}
                    >
                      <p className="text-sm font-medium truncate mb-1">
                        {session.preview}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.lastMessageAt).toLocaleDateString()}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(session.sessionId);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3"
          >
            {messages.map((message, index) => (
              <ChatMessage 
                key={index} 
                {...message} 
                onRate={handleRate}
                imageUrl={message.imageUrl}
              />
            ))}
            {isLoading && (
              <ChatMessage
                role="assistant"
                content=""
                isTyping={true}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-muted/50">
            {isLimitReached && !user && (
              <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                  Free chat limit reached
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  You've used {chatCount} of {chatLimit} free chats. Sign in or register for unlimited access.
                </p>
              </div>
            )}
            {/* Image Upload Limit Warning for Logged-in Users */}
            {user && imageUploadLimit !== null && (
              <div className="mb-2 text-xs text-muted-foreground">
                Images today: {imageUploadCount} / {imageUploadLimit}
                {imageLimitReached && (
                  <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                    (Limit reached - text/voice still available)
                  </span>
                )}
              </div>
            )}
            {/* Image Preview with Description Input - DISABLED: Coming soon */}
            {false && imagePreview && (
              <div className="mb-2 space-y-2">
                <div className="relative inline-block">
                  <img
                    src={imagePreview || ""}
                    alt="Preview"
                    className="max-w-[200px] max-h-[200px] rounded-lg border"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      setImageDescription("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  placeholder="Describe the image or ask a question about it... (optional but helpful!)"
                  className="text-sm"
                  disabled={uploadingImage || isInputDisabled}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && selectedImage && !uploadingImage && !isInputDisabled) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleImageUpload();
                    }
                  }}
                />
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
                disabled={imageLimitReached && user ? true : isInputDisabled}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  // Show "Coming soon" toast notification
                  toast({
                    title: "Coming Soon",
                    description: "Image upload feature is coming soon! For now, please describe your question or issue in text, and I'll be happy to help.",
                  });
                }}
                disabled={false}
                title="Image upload - Coming soon"
                className="h-8 w-8"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              {/* Image send button - DISABLED: Coming soon */}
              {false && selectedImage && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleImageUpload}
                  disabled={uploadingImage || isInputDisabled}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Send"
                  )}
                </Button>
              )}
              <VoiceInput
                onTranscript={handleVoiceTranscript}
                disabled={isInputDisabled}
              />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isLimitReached && !user ? "Sign in or register to continue..." : "Type your message..."}
                disabled={isInputDisabled}
                className="flex-1"
              />
              <Button
                onClick={() => handleSend()}
                disabled={isInputDisabled || !input.trim()}
                size="icon"
                className="h-8 w-8"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {!isLimitReached ? (
                <>
              Ask me about blog posts, topics, donations, or anything about CodeCraft Academy
                  {!user && (
                    <span className="block mt-1.5 font-medium text-foreground">
                      Free chats: {chatCount} / {chatLimit} used
                      {chatLimit - chatCount > 0 && (
                        <span className="text-primary"> ({chatLimit - chatCount} remaining)</span>
                      )}
                    </span>
                  )}
                </>
              ) : (
                !user && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    You've reached the free chat limit ({chatCount} / {chatLimit})
                  </span>
                )
              )}
            </p>
            {!user && (shouldShowAuthButtons || chatCount > 0) && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-center text-foreground">
                  {isLimitReached 
                    ? "Get unlimited access to continue chatting" 
                    : "Get unlimited access - Sign in or register"}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Close chatbot and navigate to auth page
                      setIsOpen(false);
                      router.push("/auth");
                    }}
                  >
                    <LogIn className="h-3.5 w-3.5 mr-1.5" />
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Close chatbot and navigate to auth page
                      setIsOpen(false);
                      router.push("/auth");
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Register
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );
}

