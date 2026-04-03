"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

interface GlobalSearchFormProps {
  initialQuery?: string;
  placeholder?: string;
  className?: string;
}

interface SuggestionHit {
  href: string;
  title: string;
}

export function GlobalSearchForm({
  initialQuery = "",
  placeholder = "Search cleaning methods, surfaces, problems, and guides",
  className = "",
}: GlobalSearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SuggestionHit[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/public/search-suggestions?q=${encodeURIComponent(q)}`,
          );
          if (!res.ok) {
            setSuggestions([]);
            return;
          }
          const data = (await res.json()) as { results?: SuggestionHit[] };
          setSuggestions(Array.isArray(data.results) ? data.results : []);
        } catch {
          setSuggestions([]);
        }
      })();
    }, 150);

    return () => window.clearTimeout(handle);
  }, [query]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fromForm = String(formData.get("q") ?? "").trim();
    const trimmed = fromForm || query.trim();

    if (!trimmed) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className={`relative ${className}`.trim()}>
      <form
        onSubmit={onSubmit}
        className="flex w-full gap-3"
        role="search"
        data-testid="global-search-form"
        action="/search"
        method="get"
      >
        <input
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-[#C9B27C]/20 bg-white px-4 py-3 font-[var(--font-manrope)] text-sm text-[#0F172A] outline-none ring-0 placeholder:text-[#94A3B8]"
          aria-label="Search site"
          autoComplete="off"
          data-testid="global-search-input"
        />
        <button
          type="submit"
          className="rounded-2xl bg-[#0D9488] px-5 py-3 font-[var(--font-manrope)] text-sm font-semibold text-white transition hover:bg-[#0B7F75]"
          data-testid="global-search-submit"
        >
          Search
        </button>
      </form>
      {suggestions.length > 0 ? (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-2xl border border-[#C9B27C]/20 bg-white py-1 shadow-lg"
          data-testid="global-search-suggestions"
        >
          {suggestions.map((s) => (
            <a
              key={`${s.href}-${s.title}`}
              href={s.href}
              className="block px-4 py-2.5 font-[var(--font-manrope)] text-sm text-[#0F172A] hover:bg-[#FFF9F3]"
              data-testid="global-search-suggestion-item"
            >
              {s.title}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
