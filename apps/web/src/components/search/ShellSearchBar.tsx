"use client";

import { GlobalSearchForm } from "./GlobalSearchForm";

interface ShellSearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  className?: string;
}

export function ShellSearchBar({
  initialQuery = "",
  placeholder = "Search the encyclopedia",
  className = "",
}: ShellSearchBarProps) {
  return (
    <div className={className}>
      <GlobalSearchForm initialQuery={initialQuery} placeholder={placeholder} />
    </div>
  );
}
