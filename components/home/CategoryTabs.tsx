"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
}

interface CategoryTabsProps {
  categories: Category[];
  onCategoryChange: (categorySlug: string | null) => void;
  activeCategory: string | null;
}

export function CategoryTabs({ categories, onCategoryChange, activeCategory }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Button
        variant={activeCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(null)}
        className={cn(
          "rounded-full",
          activeCategory === null && "bg-primary text-primary-foreground"
        )}
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category._id}
          variant={activeCategory === category.slug.current ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.slug.current)}
          className={cn(
            "rounded-full",
            activeCategory === category.slug.current && "bg-primary text-primary-foreground"
          )}
        >
          {category.title}
        </Button>
      ))}
    </div>
  );
}

