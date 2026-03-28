import { GlobalSearchForm } from "./GlobalSearchForm";

interface ShellSearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  className?: string;
}

export function ShellSearchBar({
  initialQuery = "",
  placeholder = "Search cleaning methods, surfaces, problems, and guides",
  className = "",
}: ShellSearchBarProps) {
  return (
    <div className={className}>
      <GlobalSearchForm initialQuery={initialQuery} placeholder={placeholder} />
    </div>
  );
}
