"use client";

import { PostCard, type Post } from "@/components/blog/PostCard";
import { CategoryTabs } from "./CategoryTabs";
import { useState, useMemo } from "react";

interface Category {
  id: string;
  title: string;
  slug: string;
}

interface FilteredPostsProps {
  posts: Post[];
  categories: Category[];
  searchQuery?: string;
}

export function FilteredPosts({ posts, categories, searchQuery = "" }: FilteredPostsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    let result = posts;

    // Filter by category
    if (activeCategory) {
      result = result.filter((post) => {
        if (!post.blog_categories) return false;
        if (Array.isArray(post.blog_categories)) {
          return post.blog_categories.some((cat) => cat.slug === activeCategory);
        }
        return post.blog_categories.slug === activeCategory;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((post) => {
        const title = post.title?.toLowerCase() || "";
        const excerpt = post.excerpt?.toLowerCase() || "";
        return title.includes(q) || excerpt.includes(q);
      });
    }

    return result;
  }, [posts, activeCategory, searchQuery]);

  return (
    <>
      <CategoryTabs
        categories={categories}
        onCategoryChange={setActiveCategory}
        activeCategory={activeCategory}
      />
      {filteredPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>{searchQuery ? `No posts found for "${searchQuery}".` : "No posts found in this category."}</p>
        </div>
      )}
    </>
  );
}












