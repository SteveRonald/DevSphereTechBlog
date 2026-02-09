"use client";

import { useState, useCallback } from "react";
import { PostCard, type Post } from "@/components/blog/PostCard";
import { FilteredPosts } from "./FilteredPosts";
import { PageSearch } from "@/components/search/PageSearch";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Category {
  id: string;
  title: string;
  slug: string;
}

interface SearchableKnowledgeBaseProps {
  posts: Post[];
  categories: Category[];
}

export function SearchableKnowledgeBase({ posts, categories }: SearchableKnowledgeBaseProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight font-google-sans">From the Knowledge Base</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <PageSearch placeholder="Search articles..." onSearch={handleSearch} className="flex-1 sm:w-80" />
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 whitespace-nowrap" asChild>
            <Link href="/blog">View all</Link>
          </Button>
        </div>
      </div>

      <FilteredPosts posts={posts} categories={categories} searchQuery={searchQuery} />

      <div className="mt-8 sm:mt-10 flex justify-center">
        <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 text-base font-google-sans font-medium border-2 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300" asChild>
          <Link href="/blog">View All Posts</Link>
        </Button>
      </div>
    </>
  );
}
