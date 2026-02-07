"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SortOption = "progress-desc" | "progress-asc" | "name-asc" | "name-desc" | "date-desc" | "date-asc";
type FilterOption = "all" | "in-progress" | "completed" | "passed" | "failed" | "pending-review";

interface CourseSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filterBy: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  resultCount: number;
}

export function CourseSearchFilter({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
  resultCount,
}: CourseSearchFilterProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  const clearSearch = () => {
    setLocalSearch("");
    onSearchChange("");
  };

  return (
    <div className="space-y-4" role="search" aria-label="Course search and filter">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Search courses by name..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-10 pr-10"
          aria-label="Search courses"
        />
        {localSearch && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={filterBy} onValueChange={(value) => onFilterChange(value as FilterOption)}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter courses">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending-review">Pending Review</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Sort courses">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="progress-desc">Progress: High to Low</SelectItem>
              <SelectItem value="progress-asc">Progress: Low to High</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
              <SelectItem value="date-desc">Recent First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Result Count */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {resultCount} {resultCount === 1 ? "course" : "courses"}
          </Badge>
        </div>
      </div>
    </div>
  );
}




