"use client";

import { PostCard, type Post } from "@/components/blog/PostCard";
import { CategoryTabs } from "./CategoryTabs";
import { useState, useMemo } from "react";

interface Category {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
}

interface FilteredPostsProps {
  posts: Post[];
  categories: Category[];
}

export function FilteredPosts({ posts, categories }: FilteredPostsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    if (!activeCategory) {
      return posts;
    }
    return posts.filter((post) =>
      post.categories?.some((cat) => cat.slug.current === activeCategory)
    );
  }, [posts, activeCategory]);

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
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No posts found in this category.</p>
        </div>
      )}
    </>
  );
}



