"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchFoKnowledgeProblems,
  fetchFoKnowledgeQuickSolve,
  fetchFoKnowledgeSurfaces,
} from "@/lib/api/knowledge";
import {
  KnowledgeProblem,
  KnowledgeQuickSolveResult,
  KnowledgeSeverity,
  KnowledgeSurface,
} from "@/types/knowledge";
import { trackQuickSolveLaunch } from "@/lib/analytics/searchAnalytics";
import { FoKnowledgeEmptyState } from "./FoKnowledgeEmptyState";
import { FoKnowledgeSearchPanel } from "./FoKnowledgeSearchPanel";
import { FoQuickSolveForm, FoQuickSolveFormValue } from "./FoQuickSolveForm";
import { FoQuickSolveResultCard } from "./FoQuickSolveResultCard";

interface FoKnowledgeHubPageProps {
  bookingId?: string;
  focusQuickSolve?: boolean;
  searchQuery?: string;
  surfaceId?: string;
  problemId?: string;
  severity?: KnowledgeSeverity;
}

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function normalizeBookingValue(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function guessSurfaceIdFromBookingId(bookingId?: string): string {
  const normalized = normalizeBookingValue(bookingId);

  if (normalized.includes("shower")) return "glass_shower_door";
  if (normalized.includes("tile")) return "tile";
  if (normalized.includes("grout")) return "grout";
  if (normalized.includes("stainless")) return "stainless_steel";
  if (normalized.includes("stove")) return "stovetop";
  if (normalized.includes("granite")) return "granite_countertop";
  if (normalized.includes("wood")) return "hardwood_floor";
  if (normalized.includes("baseboard")) return "baseboard";
  if (normalized.includes("toilet")) return "toilet_bowl";
  if (normalized.includes("faucet")) return "sink_faucet";
  if (normalized.includes("microwave")) return "microwave_interior";

  return "";
}

function guessProblemIdFromBookingId(bookingId?: string): string {
  const normalized = normalizeBookingValue(bookingId);

  if (normalized.includes("soap")) return "soap_scum";
  if (normalized.includes("mildew")) return "mildew";
  if (normalized.includes("grease")) return "grease";
  if (normalized.includes("food")) return "food_residue";
  if (normalized.includes("dirt")) return "dirt_buildup";
  if (normalized.includes("dust")) return "dust_buildup";
  if (normalized.includes("scale")) return "mineral_scale";
  if (normalized.includes("water")) return "hard_water_spots";

  return "";
}

function getInitialFormValue(params: {
  bookingId?: string;
  surfaceId?: string;
  problemId?: string;
  severity?: KnowledgeSeverity;
}): FoQuickSolveFormValue {
  const guessedSurface = guessSurfaceIdFromBookingId(params.bookingId);
  const guessedProblem = guessProblemIdFromBookingId(params.bookingId);

  return {
    surfaceId: params.surfaceId?.trim() || guessedSurface,
    problemId: params.problemId?.trim() || guessedProblem,
    severity: params.severity ?? "medium",
  };
}

export function FoKnowledgeHubPage({
  bookingId,
  focusQuickSolve = false,
  searchQuery = "",
  surfaceId,
  problemId,
  severity,
}: FoKnowledgeHubPageProps) {
  const quickSolveRef = useRef<HTMLDivElement | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [surfaces, setSurfaces] = useState<KnowledgeSurface[]>([]);
  const [problems, setProblems] = useState<KnowledgeProblem[]>([]);
  const [result, setResult] = useState<KnowledgeQuickSolveResult | null>(null);

  const [value, setValue] = useState<FoQuickSolveFormValue>(() =>
    getInitialFormValue({
      bookingId,
      surfaceId,
      problemId,
      severity,
    }),
  );

  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const nextToken = getStoredAccessToken();
    setToken(nextToken);

    if (!nextToken) {
      setBootError("Authentication required.");
      setIsBootLoading(false);
      return;
    }

    const authToken = nextToken;
    let cancelled = false;

    async function load() {
      try {
        setIsBootLoading(true);
        setBootError(null);

        const [nextSurfaces, nextProblems] = await Promise.all([
          fetchFoKnowledgeSurfaces(authToken),
          fetchFoKnowledgeProblems(authToken),
        ]);

        if (cancelled) return;

        setSurfaces(nextSurfaces);
        setProblems(nextProblems);
      } catch (error) {
        if (cancelled) return;
        setBootError(error instanceof Error ? error.message : "Failed to load knowledge options.");
      } finally {
        if (!cancelled) setIsBootLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setValue(
      getInitialFormValue({
        bookingId,
        surfaceId,
        problemId,
        severity,
      }),
    );
  }, [bookingId, surfaceId, problemId, severity]);

  useEffect(() => {
    if (!focusQuickSolve) return;
    const node = quickSolveRef.current;
    if (!node) return;

    const id = window.setTimeout(() => {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);

    return () => window.clearTimeout(id);
  }, [focusQuickSolve, isBootLoading]);

  const commonScenarios = useMemo(() => {
    return [
      "Glass shower door + soap scum",
      "Tile + soap scum",
      "Grout + mildew",
      "Stainless steel + grease",
      "Toilet bowl + mineral scale",
      "Microwave interior + grease",
    ];
  }, []);

  async function handleSubmit() {
    if (!token) {
      setSubmitError("Authentication required.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    trackQuickSolveLaunch({
      surfaceId: value.surfaceId,
      problemId: value.problemId,
      severity: value.severity,
      source: bookingId ? "booking" : "manual",
    });

    try {
      const nextResult = await fetchFoKnowledgeQuickSolve(
        {
          surfaceId: value.surfaceId,
          problemId: value.problemId,
          severity: value.severity as KnowledgeSeverity,
        },
        token,
      );

      setResult(nextResult);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to run Quick Solve.");
      setResult(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasPrefill =
    value.surfaceId.trim().length > 0 || value.problemId.trim().length > 0 || value.severity !== "medium";

  if (isBootLoading) {
    return (
      <div className="space-y-4" data-testid="fo-knowledge-page">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Knowledge</h1>
          <p className="mt-2 text-sm text-slate-600">Loading field-ready cleaning guidance…</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-10 rounded bg-slate-200" />
            <div className="h-10 rounded bg-slate-200" />
            <div className="h-10 rounded bg-slate-200" />
            <div className="h-12 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="space-y-4" data-testid="fo-knowledge-page">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Knowledge</h1>
          <p className="mt-2 text-sm text-slate-600">Quick answers for real cleaning situations.</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <p className="text-sm font-medium text-rose-900">{bootError}</p>
          <p className="mt-2 text-sm text-rose-700">
            Sign in as a franchise owner, then return to this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="fo-knowledge-page">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">Knowledge</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Search the encyclopedia for deeper learning, or use Quick Solve for a direct field-ready recommendation.
            </p>
          </div>

          {bookingId ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Booking context detected: <span className="font-semibold text-slate-900">{bookingId}</span>
            </div>
          ) : null}
        </div>
      </section>

      <FoKnowledgeSearchPanel initialQuery={searchQuery} />

      <section ref={quickSolveRef} className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-4">
          {hasPrefill ? (
            <div
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
              data-testid="fo-quick-solve-prefill-banner"
            >
              <p className="text-sm font-medium text-emerald-900">
                Quick Solve was prefilled from your current context. Review and adjust before running.
              </p>
            </div>
          ) : null}

          <FoQuickSolveForm
            surfaces={surfaces}
            problems={problems}
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
              Common scenarios
            </h2>
            <ul className="mt-3 space-y-2">
              {commonScenarios.map((item) => (
                <li key={item} className="text-sm text-slate-600">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
              Coming next
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Methods library preview</p>
              <p>SOP playbooks</p>
              <p>Booking-linked recommended guidance</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {submitError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-medium text-rose-900">{submitError}</p>
            </div>
          ) : null}

          {result ? <FoQuickSolveResultCard result={result} /> : <FoKnowledgeEmptyState />}
        </div>
      </section>
    </div>
  );
}
