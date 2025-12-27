"use client";

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type SystemSettings = {
  site_name: string | null;
  support_email: string | null;
  maintenance_mode: boolean;
  allow_new_signups: boolean;
  newsletter_enabled: boolean;
  course_notifications_enabled: boolean;
  course_update_notifications_enabled: boolean;
  featured_course_category: string | null;
};

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/auth?redirect=/admin-settings");
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

  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/settings", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load settings");
      }

      setSettings(data.settings);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveSettings = async () => {
    try {
      if (!settings) return;
      setSaving(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save settings");
      }

      setSettings(data.settings);
      toast({ title: "Saved", description: "System settings updated" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const showLoading = !mounted || authLoading || checkingAdmin || isAdmin !== true;

  useEffect(() => {
    if (!showLoading) {
      void loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoading]);

  return (
    <AdminShell
      title="System Settings"
      subtitle="Configure platform-wide settings"
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
              <CardTitle>System Settings</CardTitle>
              <Button variant="outline" size="sm" onClick={() => void loadSettings()} disabled={loadingSettings}>
                {loadingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSettings || !settings ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Site name</Label>
                    <Input
                      id="site_name"
                      value={settings.site_name || ""}
                      onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                      placeholder="CodeCraft Academy"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support_email">Support email</Label>
                    <Input
                      id="support_email"
                      type="email"
                      value={settings.support_email || ""}
                      onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                      placeholder="support@yourdomain.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="featured_course_category">Featured course category</Label>
                    <Input
                      id="featured_course_category"
                      value={settings.featured_course_category || ""}
                      onChange={(e) => setSettings({ ...settings, featured_course_category: e.target.value })}
                      placeholder="e.g. Web Development"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">Maintenance mode</p>
                      <p className="text-sm text-muted-foreground">Temporarily disable access for visitors</p>
                    </div>
                    <Switch
                      checked={settings.maintenance_mode}
                      onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
                      aria-label="Toggle maintenance mode"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">Allow new signups</p>
                      <p className="text-sm text-muted-foreground">Enable/disable new user registrations</p>
                    </div>
                    <Switch
                      checked={settings.allow_new_signups}
                      onCheckedChange={(checked) => setSettings({ ...settings, allow_new_signups: checked })}
                      aria-label="Toggle new signups"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">Newsletter enabled</p>
                      <p className="text-sm text-muted-foreground">Allow newsletter operations</p>
                    </div>
                    <Switch
                      checked={settings.newsletter_enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, newsletter_enabled: checked })}
                      aria-label="Toggle newsletter"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">Course notifications</p>
                      <p className="text-sm text-muted-foreground">Email subscribers when a new course is published</p>
                    </div>
                    <Switch
                      checked={settings.course_notifications_enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, course_notifications_enabled: checked })
                      }
                      aria-label="Toggle course notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">Course update notifications</p>
                      <p className="text-sm text-muted-foreground">Email subscribers when a published course is updated</p>
                    </div>
                    <Switch
                      checked={settings.course_update_notifications_enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, course_update_notifications_enabled: checked })
                      }
                      aria-label="Toggle course update notifications"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => void saveSettings()} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}
