"use client";

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";

type DayPoint = {
  date: string;
  courses_created: number;
  enrollments: number;
  completions: number;
  users_created: number;
  subscribers_created: number;
};

type AnalyticsResponse = {
  days: number;
  start: string;
  totals: {
    courses_created: number;
    enrollments: number;
    completions: number;
    users_created: number;
    subscribers_created: number;
  };
  series: DayPoint[];
};

export default function AdminAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/auth?redirect=/admin-analytics");
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

  const loadAnalytics = async (targetDays: number) => {
    try {
      setLoadingAnalytics(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`/api/admin/analytics?days=${targetDays}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.error || "Failed to load analytics");

      setData(json as AnalyticsResponse);
    } catch (e: any) {
      setData(null);
      console.error(e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (!mounted || !user || authLoading) return;
    void loadAnalytics(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user, authLoading, days]);

  const series = data?.series || [];

  const chartConfig = useMemo(
    () => ({
      courses_created: { label: "Courses created", color: "hsl(var(--chart-1))" },
      enrollments: { label: "Enrollments", color: "hsl(var(--chart-2))" },
      completions: { label: "Completions", color: "hsl(var(--chart-3))" },
      users_created: { label: "New users", color: "hsl(var(--chart-4))" },
      subscribers_created: { label: "New subscribers", color: "hsl(var(--chart-5))" },
    }),
    []
  );

  if (!mounted) return null;

  if (authLoading || checkingAdmin || loadingAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (isAdmin === false) {
    router.push("/");
    return null;
  }

  return (
    <AdminShell
      title="Analytics"
      subtitle="Course activity trends"
      userEmail={user.email}
      userName={user.user_metadata?.full_name || user.email}
      onSignOut={handleSignOut}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Showing last <span className="font-medium text-foreground">{days}</span> days
          </div>
          <div className="flex items-center gap-2">
            {[7, 30, 60, 90].map((d) => (
              <Button
                key={d}
                variant={days === d ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Courses created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.totals.courses_created ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.totals.enrollments ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Completions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.totals.completions ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">New users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.totals.users_created ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">New subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.totals.subscribers_created ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Enrollments & Completions</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickMargin={8} minTickGap={24} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="enrollments" stroke={"hsl(var(--chart-2))"} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="completions" stroke={"hsl(var(--chart-3))"} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Courses created</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickMargin={8} minTickGap={24} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="courses_created" fill={"hsl(var(--chart-1))"} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users & Subscribers</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickMargin={8} minTickGap={24} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="users_created" stroke={"hsl(var(--chart-4))"} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="subscribers_created" stroke={"hsl(var(--chart-5))"} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
