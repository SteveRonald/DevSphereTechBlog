"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { sanityClient } from "@/lib/sanity";
import { groq } from "next-sanity";

interface SearchResult {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  excerpt?: string;
}

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults([]);
      return;
    }

    const searchPosts = async () => {
      if (search.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const query = groq`*[_type == "post" && (title match $search || excerpt match $search)] | order(publishedAt desc) [0...10] {
          _id,
          title,
          slug,
          excerpt
        }`;
        
        const posts = await sanityClient.fetch<SearchResult[]>(query, {
          search: `*${search}*`,
        });
        
        setResults(posts || []);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchPosts, 300);
    return () => clearTimeout(timeoutId);
  }, [search, open]);

  const handleSelect = (slug: string) => {
    if (slug) {
      router.push(`/blog/${slug}`);
      onOpenChange(false);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search posts..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {loading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}
        {!loading && results.length === 0 && search.length >= 2 && (
          <CommandEmpty>No posts found.</CommandEmpty>
        )}
        {!loading && search.length < 2 && (
          <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
        )}
        {results.length > 0 && (
          <CommandGroup heading="Posts">
            {results.map((post) => (
              <CommandItem
                key={post._id}
                value={post.slug?.current || post.title}
                onSelect={() => handleSelect(post.slug?.current || "")}
              >
                <div className="flex flex-col">
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

