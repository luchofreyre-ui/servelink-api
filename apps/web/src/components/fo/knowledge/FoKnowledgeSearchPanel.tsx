"use client";

import { ShellSearchBar } from "@/components/search/ShellSearchBar";

interface FoKnowledgeSearchPanelProps {
  initialQuery?: string;
}

export function FoKnowledgeSearchPanel({
  initialQuery = "",
}: FoKnowledgeSearchPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="fo-knowledge-search-panel">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Search Knowledge</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Search methods, surfaces, problems, tools, guides, and questions across the encyclopedia.
          </p>
        </div>

        <ShellSearchBar
          initialQuery={initialQuery}
          placeholder="Search soap scum, shower glass, degreasing, hard water..."
        />

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            When to use search vs Quick Solve
          </p>
          <div className="mt-2 space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Search</span> is best when you want to learn,
              compare, or find the right topic.
            </p>
            <p>
              <span className="font-semibold text-slate-900">Quick Solve</span> is best when you already know
              the surface and problem and need a field-ready recommendation now.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
