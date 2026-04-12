import {
  KnowledgeProblem,
  KnowledgeQuickSolveResult,
  KnowledgeSeverity,
  KnowledgeSurface,
} from "@/types/knowledge";
import { API_BASE_URL } from "@/lib/api";

function buildHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchFoKnowledgeSurfaces(token: string): Promise<KnowledgeSurface[]> {
  const response = await fetch(`${API_BASE_URL}/fo/knowledge/surfaces`, {
    method: "GET",
    headers: buildHeaders(token),
    cache: "no-store",
  });

  return readJson<KnowledgeSurface[]>(response);
}

export async function fetchFoKnowledgeProblems(token: string): Promise<KnowledgeProblem[]> {
  const response = await fetch(`${API_BASE_URL}/fo/knowledge/problems`, {
    method: "GET",
    headers: buildHeaders(token),
    cache: "no-store",
  });

  return readJson<KnowledgeProblem[]>(response);
}

export interface FetchFoKnowledgeQuickSolveParams {
  surfaceId: string;
  problemId: string;
  severity: KnowledgeSeverity;
}

export async function fetchFoKnowledgeQuickSolve(
  params: FetchFoKnowledgeQuickSolveParams,
  token: string,
): Promise<KnowledgeQuickSolveResult> {
  const search = new URLSearchParams({
    surfaceId: params.surfaceId,
    problemId: params.problemId,
    severity: params.severity,
  });

  const response = await fetch(
    `${API_BASE_URL}/fo/knowledge/quick-solve?${search.toString()}`,
    {
      method: "GET",
      headers: buildHeaders(token),
      cache: "no-store",
    },
  );

  return readJson<KnowledgeQuickSolveResult>(response);
}
