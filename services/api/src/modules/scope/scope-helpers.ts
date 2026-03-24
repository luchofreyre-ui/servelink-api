import { getTaskById } from "./task-catalog";
import { getBundleById } from "./task-bundles";
import type { TaskDefinition } from "./task-types";
import type { TaskBundleDefinition } from "./task-types";

export function resolveTaskIds(taskIds: readonly string[]): TaskDefinition[] {
  const out: TaskDefinition[] = [];
  for (const id of taskIds) {
    const t = getTaskById(id);
    if (t) out.push(t);
  }
  return out;
}

export function labelsForTaskIds(taskIds: readonly string[]): string[] {
  return resolveTaskIds(taskIds).map((t) => t.label);
}

export function resolveBundleIds(bundleIds: readonly string[]): TaskBundleDefinition[] {
  const out: TaskBundleDefinition[] = [];
  for (const id of bundleIds) {
    const b = getBundleById(id);
    if (b) out.push(b);
  }
  return out;
}

export function bundleLabelsForIds(bundleIds: readonly string[]): string[] {
  return resolveBundleIds(bundleIds).map((b) => b.label);
}

/** One-line summary for explainer / admin copy */
export function summarizeBundles(bundleIds: readonly string[]): string {
  const bundles = resolveBundleIds(bundleIds);
  if (!bundles.length) return "";
  return bundles.map((b) => b.summary).join(" · ");
}

/** Flatten bundle task ids in order (bundles × tasks, dedupe preserving first occurrence). */
export function taskIdsFromBundles(bundleIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const bid of bundleIds) {
    const b = getBundleById(bid);
    if (!b) continue;
    for (const tid of b.taskIds) {
      if (!seen.has(tid)) {
        seen.add(tid);
        ordered.push(tid);
      }
    }
  }
  return ordered;
}

export type VisitScopeDisplay = {
  bundleSummaries: string[];
  taskLabels: string[];
  headline: string;
};

export function buildVisitScopeDisplay(args: {
  taskBundleIds: readonly string[];
  taskIds: readonly string[];
}): VisitScopeDisplay {
  const bundles = resolveBundleIds(args.taskBundleIds);
  const bundleSummaries = bundles.map((b) => b.summary);
  const tasks = resolveTaskIds(args.taskIds.length ? args.taskIds : taskIdsFromBundles(args.taskBundleIds));
  const taskLabels = tasks.map((t) => t.label);
  const headline =
    bundles.length === 1
      ? bundles[0].label
      : bundles.map((b) => b.label).join(" + ");
  return { bundleSummaries, taskLabels, headline };
}
