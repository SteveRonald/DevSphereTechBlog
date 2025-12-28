"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { sanityClient } from "@/lib/sanity";
import { groq } from "next-sanity";
import { createClient } from "@/lib/supabase";
import { BookOpen, FileText } from "lucide-react";

interface BlogSearchResult {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  excerpt?: string;
  type: "post";
}

interface CourseSearchResult {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  type: "course";
}

type SearchResult = BlogSearchResult | CourseSearchResult;

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [search, setSearch] = useState("");
  const [blogResults, setBlogResults] = useState<BlogSearchResult[]>([]);
  const [courseResults, setCourseResults] = useState<CourseSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setSearch("");
      setBlogResults([]);
      setCourseResults([]);
      return;
    }

    const searchAll = async () => {
      if (search.length < 2) {
        setBlogResults([]);
        setCourseResults([]);
        return;
      }

      setLoading(true);
      try {
        // Search blog posts and courses in parallel
        const [posts, courses] = await Promise.all([
          // Search blog posts from Sanity
          sanityClient.fetch<BlogSearchResult[]>(
            groq`*[_type == "post" && publishedAt != null && (title match $search || excerpt match $search)] | order(publishedAt desc) [0...5] {
              _id,
              title,
              slug,
              excerpt,
              "type": "post"
            }`,
            { search: `*${search}*` }
          ).catch(() => []),
          
          // Search courses from Supabase (only published courses for security)
          (async () => {
            try {
              const supabase = createClient();
              const { data, error } = await supabase
                .from("courses")
                .select("id, title, slug, short_description")
                .eq("is_published", true)
                .or(`title.ilike.%${search}%,short_description.ilike.%${search}%,description.ilike.%${search}%`)
                .limit(5);
              
              if (error) return [];
              return (data || []).map(course => ({
                ...course,
                type: "course" as const
              }));
            } catch {
              return [];
            }
          })()
        ]);
        
        setBlogResults(posts || []);
        setCourseResults(courses || []);
      } catch (error) {
        console.error("Search error:", error);
        setBlogResults([]);
        setCourseResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchAll, 300);
    return () => clearTimeout(timeoutId);
  }, [search, open]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === "post") {
      router.push(`/blog/${result.slug.current}`);
    } else if (result.type === "course") {
      router.push(`/courses/${result.slug}`);
    }
    onOpenChange(false);
  };

  const totalResults = blogResults.length + courseResults.length;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search posts, courses..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {loading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}
        {!loading && totalResults === 0 && search.length >= 2 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {!loading && search.length < 2 && (
          <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
        )}
        {!loading && courseResults.length > 0 && (
          <CommandGroup heading="Courses">
            {courseResults.map((course) => (
              <CommandItem
                key={course.id}
                value={`course-${course.slug}`}
                onSelect={() => handleSelect(course)}
              >
                <BookOpen className="mr-2 h-4 w-4 shrink-0" />
                <div className="flex flex-col flex-1">
                  <span className="font-medium">{course.title}</span>
                  {course.short_description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {course.short_description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!loading && blogResults.length > 0 && (
          <CommandGroup heading="Blog Posts">
            {blogResults.map((post) => (
              <CommandItem
                key={post._id}
                value={`post-${post.slug?.current || post.title}`}
                onSelect={() => handleSelect(post)}
              >
                <FileText className="mr-2 h-4 w-4 shrink-0" />
                <div className="flex flex-col flex-1">
                  <span className="font-medium">{post.title}</span>
                  {post.excerpt && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {post.excerpt}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

