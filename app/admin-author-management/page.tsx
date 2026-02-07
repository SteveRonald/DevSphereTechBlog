"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminShell } from "@/components/admin/AdminShell";
import { AuthorForm } from "@/components/admin/AuthorForm";
import { createClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Author {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  bio_html?: string;
  image_url?: string;
  role?: string;
  email?: string;
  website?: string;
  twitter_url?: string;
  github_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  instagram_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminAuthorPage() {
  const router = useRouter();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    fetchAuthors();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("display_name, first_name, last_name")
          .eq("id", user.id)
          .single();
        if (profile) {
          setUserName(
            profile.display_name ||
            `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
            null
          );
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("blog_authors")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setAuthors(data || []);
    } catch (error: any) {
      console.error("Error fetching authors:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch authors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this author?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("blog_authors").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Author deleted successfully",
      });

      fetchAuthors();
    } catch (error: any) {
      console.error("Error deleting author:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete author",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (author: Author) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("blog_authors")
        .update({ active: !author.active })
        .eq("id", author.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Author ${author.active ? "deactivated" : "activated"} successfully`,
      });

      fetchAuthors();
    } catch (error: any) {
      console.error("Error updating author:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update author",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const filteredAuthors = authors.filter((author) =>
    author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    author.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    author.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminShell
      title="Author Management"
      subtitle="Manage blog authors and their profiles"
      userEmail={userEmail}
      userName={userName}
      onSignOut={handleSignOut}
    >
      {showForm ? (
        <AuthorForm
          author={editingAuthor}
          onClose={() => {
            setShowForm(false);
            setEditingAuthor(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingAuthor(null);
            fetchAuthors();
          }}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search authors by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Author
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading authors...</div>
          ) : filteredAuthors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No authors found matching your search." : "No authors yet."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Author
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAuthors.map((author) => (
                <Card key={author.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {author.image_url ? (
                          <div className="relative h-12 w-12 rounded-full overflow-hidden shrink-0">
                            <Image
                              src={author.image_url}
                              alt={author.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <ImageIcon className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base truncate">{author.name}</CardTitle>
                          {author.role && (
                            <CardDescription className="truncate">{author.role}</CardDescription>
                          )}
                        </div>
                      </div>
                      <Badge variant={author.active ? "default" : "secondary"}>
                        {author.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {author.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {author.bio}
                      </p>
                    )}
                    {author.email && (
                      <p className="text-xs text-muted-foreground mb-2">{author.email}</p>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAuthor(author);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(author)}
                      >
                        {author.active ? (
                          <>
                            <UserX className="h-3 w-3 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(author.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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




