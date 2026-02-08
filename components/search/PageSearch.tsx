"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageSearchProps {
  placeholder?: string;
  className?: string;
  searchPath?: string;
  onSearch?: (query: string) => void;
}

export function PageSearch({ 
  placeholder = "Search...", 
  className = "",
  searchPath = "/search",
  onSearch,
}: PageSearchProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const executeSearch = () => {
    if (!query.trim()) return;
    if (onSearch) {
      onSearch(query.trim());
    } else {
      router.push(`${searchPath}?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
      />
    </form>
  );
}
