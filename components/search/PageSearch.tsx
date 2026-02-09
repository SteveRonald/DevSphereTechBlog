"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface PageSearchProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export function PageSearch({ 
  placeholder = "Search...", 
  className = "",
  onSearch,
}: PageSearchProps) {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!onSearch) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      onSearch(query.trim());
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, onSearch]);

  const clearSearch = () => {
    setQuery("");
    onSearch?.("");
  };

  return (
    <div className={`relative min-w-[200px] ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-10 pr-9 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 placeholder:text-muted-foreground"
      />
      {query && (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
