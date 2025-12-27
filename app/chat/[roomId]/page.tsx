"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Room = {
  id: string;
  name: string;
};

type Message = {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params?.roomId as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const supabase = useMemo(() => createClient(), []);

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth?redirect=/chat/${encodeURIComponent(roomId)}`);
    }
  }, [authLoading, user, router, roomId]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("chat_rooms").select("id,name").eq("id", roomId).single();
      if (error) throw error;
      setRoom(data as any);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Room not found", variant: "destructive" });
      router.push("/chat");
    } finally {
      setLoading(false);
    }
  };

  const loadAdminFlag = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase.from("user_profiles").select("is_admin").eq("id", user.id).single();
      if (error) throw error;
      setIsAdmin(data?.is_admin === true);
    } catch {
      setIsAdmin(false);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_room_messages")
        .select("id,room_id,user_id,content,created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(200);

      if (error) throw error;
      setMessages((data || []) as any);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load messages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && roomId) {
      void loadRoom();
      void loadMessages();
      void loadAdminFlag();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, roomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!user || !roomId) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_room_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const row = payload.new as any as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_room_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const row = payload.old as any as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== row.id));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, roomId, user?.id]);

  const send = async () => {
    const content = text.trim();
    if (!content || !user) return;

    try {
      setSending(true);
      const { error } = await supabase.from("chat_room_messages").insert({ room_id: roomId, user_id: user.id, content });
      if (error) throw error;
      setText("");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!id) return;
    try {
      setDeleting(true);
      const { error } = await supabase.from("chat_room_messages").delete().eq("id", id);
      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to delete message", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-10">
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => (open ? undefined : setDeleteTargetId(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the message for everyone in this room.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting || !deleteTargetId}
              onClick={() => (deleteTargetId ? void deleteMessage(deleteTargetId) : undefined)}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">{room?.name || "Chat"}</CardTitle>
            <Button variant="outline" onClick={() => router.push("/chat")}>Back</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[55vh] overflow-y-auto rounded-md border border-border p-3 space-y-2">
            {messages.map((m) => {
              const mine = m.user_id === user?.id;
              const canDelete = mine || isAdmin;
              return (
                <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      mine
                        ? "max-w-[80%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm"
                        : "max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm"
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                      {canDelete ? (
                        <Button
                          type="button"
                          variant={mine ? "secondary" : "ghost"}
                          size="icon"
                          className={mine ? "h-7 w-7" : "h-7 w-7"}
                          aria-label="Delete message"
                          onClick={() => setDeleteTargetId(m.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                    <div className={mine ? "mt-1 text-[10px] opacity-80 text-right" : "mt-1 text-[10px] opacity-70"}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void send();
                }
              }}
              disabled={sending}
            />
            <Button onClick={() => void send()} disabled={sending || !text.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
