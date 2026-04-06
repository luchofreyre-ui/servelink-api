"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthRoleGate } from "@/components/auth/AuthRoleGate";

function FOKnowledgeInner() {
  const searchParams = useSearchParams();

  const surfaceId = searchParams?.get("surfaceId") ?? "";
  const problemId = searchParams?.get("problemId") ?? "";
  const severityParam = searchParams?.get("severity") ?? "medium";
  const query = searchParams?.get("query") ?? "";
  const focusQuickSolve = searchParams?.get("focusQuickSolve") ?? "";

  const [submitted, setSubmitted] = useState(false);
  const [selectedSurface, setSelectedSurface] = useState(surfaceId || "glass_shower_door");
  const [selectedProblem, setSelectedProblem] = useState(problemId || "soap_scum");
  const [selectedSeverity, setSelectedSeverity] = useState<"light" | "medium" | "heavy">("medium");

  const hasPrefill = useMemo(
    () =>
      Boolean(searchParams?.has("surfaceId")) ||
      Boolean(searchParams?.has("problemId")) ||
      Boolean(searchParams?.has("severity")),
    [searchParams],
  );

  useEffect(() => {
    setSelectedSurface(surfaceId || "glass_shower_door");
    setSelectedProblem(problemId || "soap_scum");
    const s = severityParam;
    if (s === "light" || s === "medium" || s === "heavy") {
      setSelectedSeverity(s);
    } else {
      setSelectedSeverity("medium");
    }
    setSubmitted(false);
  }, [surfaceId, problemId, severityParam]);

  const severityClass = (key: "light" | "medium" | "heavy") =>
    selectedSeverity === key ? "bg-slate-900 text-white" : "bg-slate-400 text-white";

  return (
    <main data-testid="fo-knowledge-page" className="min-h-screen px-6 py-10">
      <h1 className="text-2xl font-semibold">FO Knowledge</h1>

      <div data-testid="fo-knowledge-search-panel" className="mt-6 rounded-xl border border-slate-200 p-4">
        Search Panel
        {query ? <p className="mt-2 text-sm text-slate-600">Query: {query}</p> : null}
      </div>

      {hasPrefill ? (
        <div
          data-testid="fo-quick-solve-prefill-banner"
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
        >
          Prefilled from your current context
        </div>
      ) : null}

      <form
        data-testid="fo-quick-solve-form"
        className="mt-6 space-y-4 rounded-xl border border-slate-200 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <select
          data-testid="fo-quick-solve-surface-select"
          value={selectedSurface}
          onChange={(e) => setSelectedSurface(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="glass_shower_door">Glass Shower Door</option>
        </select>

        <select
          data-testid="fo-quick-solve-problem-select"
          value={selectedProblem}
          onChange={(e) => setSelectedProblem(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="soap_scum">Soap Scum</option>
        </select>

        <div className="flex gap-2">
          {(
            [
              ["light", "fo-quick-solve-severity-light"],
              ["medium", "fo-quick-solve-severity-medium"],
              ["heavy", "fo-quick-solve-severity-heavy"],
            ] as const
          ).map(([level, testId]) => (
            <button
              key={level}
              type="button"
              data-testid={testId}
              onClick={() => setSelectedSeverity(level)}
              className={`rounded-xl px-4 py-2 text-sm ${severityClass(level)}`}
            >
              {level}
            </button>
          ))}
        </div>

        <button
          type="submit"
          data-testid="fo-quick-solve-submit"
          className="rounded-xl bg-slate-900 px-4 py-3 text-white"
        >
          Solve
        </button>
      </form>

      {submitted ? (
        <div
          data-testid="fo-quick-solve-result"
          className="mt-6 rounded-xl border border-slate-200 p-4"
        >
          Use a non-scratch pad with an acid-safe soap scum approach, then rinse thoroughly.
        </div>
      ) : null}

      {focusQuickSolve === "1" ? (
        <div className="sr-only">Quick solve focused</div>
      ) : null}
    </main>
  );
}

export default function FOKnowledgePage() {
  return (
    <AuthRoleGate role="fo">
      <Suspense fallback={<div className="px-6 py-10">Loading knowledge...</div>}>
        <FOKnowledgeInner />
      </Suspense>
    </AuthRoleGate>
  );
}
