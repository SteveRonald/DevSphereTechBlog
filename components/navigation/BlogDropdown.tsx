"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  title: string;
  slug: string;
}

export function BlogDropdown() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch from Supabase only
        const { createClient } = await import("@/lib/supabase");
        const supabase = createClient();
        const { data: categories } = await supabase
          .from("blog_categories")
          .select("id, title, slug")
          .order("title", { ascending: true });
        
        setCategories(categories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const isBlogPage = pathname?.startsWith("/blog") || pathname === "/blog";

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link
        href="/blog"
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
          isBlogPage ? "text-foreground" : "text-foreground/60"
        )}
      >
        Blog
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </Link>

      {isOpen && categories.length > 0 && (
        <div
          className="absolute top-full left-0 pt-2 w-56 z-50"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="rounded-md border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="p-2">
              <Link
                href="/blog"
                className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                All Posts
              </Link>
              <div className="h-px bg-border my-1" />
              <div className="space-y-1">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/blog/category/${category.slug}`}
                    className="block px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {category.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
