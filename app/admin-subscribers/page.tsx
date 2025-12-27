"use client";

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

type AdminSubscriber = {
  id: string;
  email: string;
  is_active: boolean;
  notify_new_courses: boolean;
  notify_course_updates: boolean;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  unsubscribe_reason: string | null;
};

export default function AdminSubscribersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [query, setQuery] = useState("");
  const [subscribers, setSubscribers] = useState<AdminSubscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [updatingFieldBySubscriber, setUpdatingFieldBySubscriber] = useState<Record<string, Partial<Record<"is_active" | "notify_new_courses" | "notify_course_updates", boolean>>>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/auth?redirect=/admin-subscribers");
    }
  }, [user, authLoading, router, mounted]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || authLoading) {
        setCheckingAdmin(true);
        return;
      }

      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        setIsAdmin(data?.is_admin === true);
      } catch {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (mounted && user && !authLoading) {
      void checkAdmin();
    } else if (mounted && !user && !authLoading) {
      setCheckingAdmin(false);
    }
  }, [user, mounted, authLoading]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const loadSubscribers = async (q?: string) => {
    try {
      setLoadingSubscribers(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        `/api/admin/subscribers?q=${encodeURIComponent((q ?? query).trim())}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load subscribers");
      }

      setSubscribers(data.subscribers || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load subscribers",
        variant: "destructive",
      });
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const patchSubscriber = async (
    target: AdminSubscriber,
    patch: { is_active?: boolean; notify_new_courses?: boolean; notify_course_updates?: boolean }
  ) => {
    const field = (Object.keys(patch)[0] || "") as
      | "is_active"
      | "notify_new_courses"
      | "notify_course_updates";

    try {
      setUpdatingFieldBySubscriber((prev) => ({
        ...prev,
        [target.id]: { ...(prev[target.id] || {}), [field]: true },
      }));
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/admin/subscribers/${target.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(patch),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update subscriber");
      }

      setSubscribers((prev) => prev.map((s) => (s.id === target.id ? data.subscriber : s)));
      toast({
        title: "Updated",
        description: "Subscriber updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update subscriber",
        variant: "destructive",
      });
    } finally {
      setUpdatingFieldBySubscriber((prev) => ({
        ...prev,
        [target.id]: { ...(prev[target.id] || {}), [field]: false },
      }));
    }
  };

  const selectedList = subscribers.filter((s) => selectedIds[s.id]);
  const allSelected = subscribers.length > 0 && selectedList.length === subscribers.length;
  const someSelected = selectedList.length > 0 && selectedList.length < subscribers.length;

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const s of subscribers) next[s.id] = true;
    setSelectedIds(next);
  };

  const bulkUpdate = async (patch: { is_active?: boolean; notify_new_courses?: boolean; notify_course_updates?: boolean }) => {
    try {
      if (selectedList.length === 0) {
        toast({ title: "No selection", description: "Select at least one subscriber" });
        return;
      }
      setBulkBusy(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/subscribers/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          ids: selectedList.map((s) => s.id),
          patch,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Bulk update failed");
      }

      const byId = new Map<string, AdminSubscriber>((data.subscribers || []).map((s: AdminSubscriber) => [s.id, s]));
      setSubscribers((prev) => prev.map((s) => byId.get(s.id) || s));
      toast({ title: "Updated", description: `Updated ${byId.size} subscriber(s)` });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Bulk update failed", variant: "destructive" });
    } finally {
      setBulkBusy(false);
    }
  };

  const showLoading = !mounted || authLoading || checkingAdmin || isAdmin !== true;

  useEffect(() => {
    if (!showLoading) {
      void loadSubscribers("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoading]);

  return (
    <AdminShell
      title="Subscribers"
      subtitle="Manage newsletter subscribers"
      userEmail={user?.email}
      userName={user?.email}
      onSignOut={handleSignOut}
    >
      {showLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Subscribers</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => void loadSubscribers()}
                disabled={loadingSubscribers}
              >
                {loadingSubscribers ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by email..."
              />
              <Button
                variant="outline"
                onClick={() => void loadSubscribers(query)}
                disabled={loadingSubscribers}
              >
                Search
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="text-sm text-muted-foreground">
                {selectedList.length} selected
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkBusy || selectedList.length === 0}
                  onClick={() => void bulkUpdate({ notify_new_courses: true })}
                >
                  Enable course emails
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkBusy || selectedList.length === 0}
                  onClick={() => void bulkUpdate({ notify_new_courses: false })}
                >
                  Disable course emails
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkBusy || selectedList.length === 0}
                  onClick={() => void bulkUpdate({ notify_course_updates: true })}
                >
                  Enable update emails
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkBusy || selectedList.length === 0}
                  onClick={() => void bulkUpdate({ notify_course_updates: false })}
                >
                  Disable update emails
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkBusy || selectedList.length === 0}
                  onClick={() => void bulkUpdate({ is_active: true })}
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkBusy || selectedList.length === 0}
                  onClick={() => void bulkUpdate({ is_active: false })}
                >
                  Deactivate
                </Button>
              </div>
            </div>

            {loadingSubscribers ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected || (someSelected ? "indeterminate" : false)}
                        onCheckedChange={(v) => toggleSelectAll(v === true)}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Course emails</TableHead>
                    <TableHead className="text-right">Update emails</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No subscribers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscribers.map((s) => {
                      const busyActive = updatingFieldBySubscriber[s.id]?.is_active === true;
                      const busyCourse = updatingFieldBySubscriber[s.id]?.notify_new_courses === true;
                      const busyUpdates = updatingFieldBySubscriber[s.id]?.notify_course_updates === true;
                      return (
                        <TableRow key={s.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds[s.id] === true}
                              onCheckedChange={(v) =>
                                setSelectedIds((prev) => ({ ...prev, [s.id]: v === true }))
                              }
                              aria-label={`Select ${s.email}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{s.email}</TableCell>
                          <TableCell>
                            {s.is_active ? (
                              <Badge>Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-2">
                              {busyCourse && <Loader2 className="h-4 w-4 animate-spin" />}
                              <Switch
                                checked={s.notify_new_courses}
                                disabled={busyCourse}
                                onCheckedChange={() =>
                                  void patchSubscriber(s, { notify_new_courses: !s.notify_new_courses })
                                }
                                aria-label={
                                  s.notify_new_courses
                                    ? "Disable course notifications"
                                    : "Enable course notifications"
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-2">
                              {busyUpdates && <Loader2 className="h-4 w-4 animate-spin" />}
                              <Switch
                                checked={s.notify_course_updates}
                                disabled={busyUpdates}
                                onCheckedChange={() =>
                                  void patchSubscriber(s, { notify_course_updates: !s.notify_course_updates })
                                }
                                aria-label={
                                  s.notify_course_updates
                                    ? "Disable course update notifications"
                                    : "Enable course update notifications"
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-2">
                              {busyActive && <Loader2 className="h-4 w-4 animate-spin" />}
                              <Switch
                                checked={s.is_active}
                                disabled={busyActive}
                                onCheckedChange={() => void patchSubscriber(s, { is_active: !s.is_active })}
                                aria-label={s.is_active ? "Deactivate subscriber" : "Activate subscriber"}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}
