"use client";

import { useState, useMemo, useCallback } from "react";
import { PostCard, type Post } from "@/components/blog/PostCard";
import { PageSearch } from "@/components/search/PageSearch";
import { BookOpen } from "lucide-react";

interface SearchablePostListProps {
  posts: Post[];
  searchPlaceholder?: string;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  hrefBase?: string;
}

export function SearchablePostList({
  posts,
  searchPlaceholder = "Search articles...",
  emptyIcon,
  emptyTitle = "No posts yet",
  emptyMessage = "Check back soon for new content!",
  hrefBase = "/blog",
}: SearchablePostListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;

    const q = searchQuery.toLowerCase();
    return posts.filter((post) => {
      const title = post.title?.toLowerCase() || "";
      const excerpt = post.excerpt?.toLowerCase() || "";
      const category = Array.isArray(post.blog_categories)
        ? post.blog_categories.map((c) => c.title.toLowerCase()).join(" ")
        : post.blog_categories?.title?.toLowerCase() || "";
      const author = post.blog_authors?.name?.toLowerCase() || "";

      return (
        title.includes(q) ||
        excerpt.includes(q) ||
        category.includes(q) ||
        author.includes(q)
      );
    });
  }, [posts, searchQuery]);

  return (
    <>
      <div className="mb-6 max-w-md">
        <PageSearch
          placeholder={searchPlaceholder}
          onSearch={handleSearch}
        />
      </div>

      {filteredPosts.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} hrefBase={hrefBase} />
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-16 sm:py-20 text-muted-foreground">
          <BookOpen className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-6 opacity-50" />
          <p className="text-xl sm:text-2xl font-medium mb-3 font-google-sans">
            No results for &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-base sm:text-lg font-google-sans">
            Try a different search term.
          </p>
        </div>
      ) : (
        <div className="text-center py-16 sm:py-20 text-muted-foreground">
          {emptyIcon || <BookOpen className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-6 opacity-50" />}
          <p className="text-xl sm:text-2xl font-medium mb-3 font-google-sans">{emptyTitle}</p>
          <p className="text-base sm:text-lg font-google-sans">{emptyMessage}</p>
        </div>
      )}
    </>
  );
}
