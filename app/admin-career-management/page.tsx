"use client";

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit, Trash2, Eye, Briefcase, Search } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { AdminShell } from "@/components/admin/AdminShell";
import { CareerForm } from "@/components/admin/CareerForm";

interface Career {
  id: string;
  title: string;
  slug: string;
  company: string;
  location: string;
  job_type: string;
  salary_range?: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits?: string;
  application_url?: string;
  application_email?: string;
  application_deadline?: string;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminCareerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCareerForm, setShowCareerForm] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [deletingCareerId, setDeletingCareerId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/auth?redirect=/admin-career-management");
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
        const { data, error } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (error) {
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.is_admin === true);
        }
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (mounted && user && !authLoading) {
      checkAdmin();
    } else if (mounted && !user && !authLoading) {
      setCheckingAdmin(false);
    }
  }, [user, mounted, authLoading]);

  useEffect(() => {
    if (isAdmin === true) {
      fetchCareers();
    }
  }, [isAdmin]);

  const fetchCareers = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("career_listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCareers(data || []);
    } catch (error: any) {
      console.error("Error fetching careers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch career listings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (careerId: string) => {
    if (!confirm("Are you sure you want to delete this career listing? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingCareerId(careerId);
      const supabase = createClient();
      const { error } = await supabase
        .from("career_listings")
        .delete()
        .eq("id", careerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Career listing deleted successfully",
      });

      fetchCareers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete career listing",
        variant: "destructive",
      });
    } finally {
      setDeletingCareerId(null);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const filteredCareers = careers.filter((career) =>
    career.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    career.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    career.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (checkingAdmin || authLoading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <AdminShell
      title="Career Management"
      subtitle="Create and manage career listings"
      userEmail={user?.email || null}
      userName={user?.user_metadata?.name || null}
      onSignOut={handleSignOut}
    >
      {showCareerForm ? (
        <CareerForm
          career={editingCareer}
          onClose={() => {
            setShowCareerForm(false);
            setEditingCareer(null);
          }}
          onSuccess={() => {
            setShowCareerForm(false);
            setEditingCareer(null);
            fetchCareers();
          }}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Career Listings</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage job opportunities
              </p>
            </div>
            <Button onClick={() => setShowCareerForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Career Listing
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search careers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredCareers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">No career listings found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : "Get started by creating your first career listing"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCareerForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Listing
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredCareers.map((career) => (
                <Card key={career.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {career.thumbnail_url && (
                        <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img
                            src={career.thumbnail_url}
                            alt={career.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold mb-1 line-clamp-2">{career.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{career.company}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge variant={career.published ? "default" : "secondary"}>
                            {career.published ? "Published" : "Draft"}
                          </Badge>
                          {career.featured && (
                            <Badge variant="outline">Featured</Badge>
                          )}
                          <Badge variant="outline">{career.job_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {career.location}
                          </span>
                          {career.salary_range && (
                            <span className="text-xs text-muted-foreground">
                              {career.salary_range}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(career.created_at).toLocaleDateString()}
                          {career.application_deadline && (
                            <span> • Deadline: {new Date(career.application_deadline).toLocaleDateString()}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/career/${career.slug}`} target="_blank">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCareer(career);
                              setShowCareerForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(career.id)}
                            disabled={deletingCareerId === career.id}
                          >
                            {deletingCareerId === career.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
