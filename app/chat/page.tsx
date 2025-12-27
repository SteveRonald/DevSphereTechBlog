"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ChatRoom = {
  id: string;
  name: string;
  created_at: string;
};

export default function ChatRoomsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth?redirect=/chat");
    }
  }, [authLoading, user, router]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("id,name,created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setRooms((data || []) as any);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load rooms", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      void loadRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const createRoom = async () => {
    const name = newRoomName.trim();
    if (!name) return;

    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("chat_rooms")
        .insert({ name, is_public: true, course_id: null, created_by: user?.id })
        .select("id")
        .single();

      if (error) throw error;

      setNewRoomName("");
      await loadRooms();

      if (data?.id) {
        router.push(`/chat/${data.id}`);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to create room", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Chat Rooms</h1>
          <p className="text-sm text-muted-foreground">Join a room to collaborate with other students in real time.</p>
        </div>
        <Button variant="outline" onClick={() => void loadRooms()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Create a room</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="e.g. React Study Group"
          />
          <Button onClick={() => void createRoom()} disabled={loading || !newRoomName.trim()}>
            Create
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading rooms...</p>
          </CardContent>
        </Card>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No rooms yet.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-base">{r.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button asChild>
                  <Link href={`/chat/${r.id}`}>Join</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
