"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface GlobalSearchFormProps {
  initialQuery?: string;
  placeholder?: string;
  className?: string;
}

export function GlobalSearchForm({
  initialQuery = "",
  placeholder = "Search cleaning methods, surfaces, problems, and guides",
  className = "",
}: GlobalSearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`flex w-full gap-3 ${className}`.trim()}
      role="search"
      data-testid="global-search-form"
    >
      <input
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
  );
}
