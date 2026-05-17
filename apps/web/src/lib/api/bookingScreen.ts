import { apiFetch } from "@/lib/api";

export type CustomerScreenSummary = {
  counts: Record<string, number>;
  rows: Array<Record<string, unknown>>;
  queue: { rows: Array<Record<string, unknown>> };
};

export type FoScreenSummary = {
  counts: Record<string, number>;
  queue: { rows: Array<Record<string, unknown>> };
};

import type { PortfolioOrchestrationSummary } from "@/lib/api/adminPortfolioOrchestration";

export type FoPortfolioOrchestrationSummary = PortfolioOrchestrationSummary;

type CustomerScreenSummaryResponse = {
  kind: "customer_screen_summary";
  summary: CustomerScreenSummary;
};

type FoScreenSummaryResponse = {
  kind: "fo_screen_summary";
  summary: FoScreenSummary;
};

type FoPortfolioOrchestrationSummaryResponse = {
  kind: "fo_portfolio_orchestration_summary";
  summary: FoPortfolioOrchestrationSummary;
};

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

/**
 * Authenticated customer operational overview (JWT via apiFetch).
 */
export async function fetchCustomerScreenSummary(): Promise<CustomerScreenSummary> {
  const res = await apiFetch("/customer/screen-summary");
  const body = (await readJson(res)) as CustomerScreenSummaryResponse | null;
  if (!res.ok) {
    throw new Error(
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: unknown }).message)
        : `Screen summary failed (${res.status})`,
    );
  }
  if (
    body &&
    typeof body === "object" &&
    body.kind === "customer_screen_summary" &&
    body.summary &&
    typeof body.summary === "object"
  ) {
    return body.summary as CustomerScreenSummary;
  }
  throw new Error("Unexpected customer screen-summary response.");
}

/**
 * Authenticated FO operational overview (JWT via apiFetch).
 */
export async function fetchFoScreenSummary(): Promise<FoScreenSummary> {
  const res = await apiFetch("/fo/screen-summary");
  const body = (await readJson(res)) as FoScreenSummaryResponse | null;
  if (!res.ok) {
    throw new Error(
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: unknown }).message)
        : `FO screen summary failed (${res.status})`,
    );
  }
  if (
    body &&
    typeof body === "object" &&
    body.kind === "fo_screen_summary" &&
    body.summary &&
    typeof body.summary === "object"
  ) {
    return body.summary as FoScreenSummary;
  }
  throw new Error("Unexpected FO screen-summary response.");
}

/**
 * FO-scoped orchestration portfolio counts (JWT via apiFetch).
 */
export async function fetchFoPortfolioOrchestrationSummary(): Promise<FoPortfolioOrchestrationSummary> {
  const res = await apiFetch("/fo/portfolio-orchestration/summary");
  const body = (await readJson(res)) as FoPortfolioOrchestrationSummaryResponse | null;
  if (!res.ok) {
    throw new Error(
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: unknown }).message)
        : `FO portfolio orchestration summary failed (${res.status})`,
    );
  }
  if (
    body &&
    typeof body === "object" &&
    body.kind === "fo_portfolio_orchestration_summary" &&
    body.summary &&
    typeof body.summary === "object"
  ) {
    return body.summary as FoPortfolioOrchestrationSummary;
  }
  throw new Error("Unexpected FO portfolio orchestration summary response.");
}
