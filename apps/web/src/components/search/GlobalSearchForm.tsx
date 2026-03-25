"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { trackSearchClick, trackSearchQuery } from "@/lib/analytics/searchAnalytics";
import { getSiteSearchSuggestions } from "@/search/getSiteSearchSuggestions";

interface GlobalSearchFormProps {
  initialQuery?: string;
  placeholder?: string;
  className?: string;
}

const TYPE_LABELS: Record<string, string> = {
  encyclopedia: "Encyclopedia",
  method: "Method",
  surface: "Surface",
  problem: "Problem",
  tool: "Tool",
  article: "Article",
  guide: "Guide",
  cluster: "Cluster",
  comparison: "Comparison",
  question: "Question",
};

export function GlobalSearchForm({
  initialQuery = "",
  placeholder = "Search the cleaning encyclopedia",
  className = "",
}: GlobalSearchFormProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLFormElement | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const node = rootRef.current;
      if (!node) return;
      if (!node.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const suggestions = useMemo(() => {
    return getSiteSearchSuggestions(query);
  }, [query]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    trackSearchQuery(trimmed);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
      role="search"
      ref={rootRef}
      data-testid="global-search-form"
    >
      <div className="relative">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 shadow-sm">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-slate-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            aria-label="Search the encyclopedia"
            autoComplete="off"
            data-testid="global-search-input"
          />

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            data-testid="global-search-submit"
          >
            Search
          </button>
        </div>

        {isOpen && suggestions.length > 0 ? (
          <div
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            data-testid="global-search-suggestions"
          >
            <div className="max-h-96 overflow-y-auto p-2">
              {suggestions.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    trackSearchClick({
                      id: item.id,
                      type: item.type,
                      query,
                    });
                    setIsOpen(false);
                  }}
                  className="block rounded-xl px-3 py-3 transition hover:bg-slate-50"
                  data-testid="global-search-suggestion-item"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                        {item.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                      {TYPE_LABELS[item.type] ?? item.type}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
              <button
                type="submit"
                className="text-xs font-semibold text-slate-700 transition hover:text-slate-900"
              >
                View all results for “{query.trim()}”
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </form>
  );
}
