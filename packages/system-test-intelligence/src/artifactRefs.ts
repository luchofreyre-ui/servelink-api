import type {
  SystemTestArtifactRef,
  SystemTestArtifactRefType,
  SystemTestCaseRowInput,
} from "./types.js";

/** Lower index = higher priority for primary artifact selection. */
export const ARTIFACT_TYPE_PRIORITY: SystemTestArtifactRefType[] = [
  "trace",
  "screenshot",
  "video",
  "stderr_log",
  "stdout_log",
  "attachment",
  "html_report_ref",
];

function typeRank(t: SystemTestArtifactRefType): number {
  const i = ARTIFACT_TYPE_PRIORITY.indexOf(t);
  return i < 0 ? 999 : i;
}

function inferTypeFromPathAndHint(
  path: string,
  hint?: string,
): SystemTestArtifactRefType {
  const lower = path.toLowerCase();
  const h = (hint ?? "").toLowerCase();
  if (h === "trace" || lower.endsWith(".zip") || lower.includes("trace")) {
    return "trace";
  }
  if (
    h === "video" ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mp4") ||
    lower.includes("video")
  ) {
    return "video";
  }
  if (
    h === "screenshot" ||
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.includes("screenshot")
  ) {
    return "screenshot";
  }
  if (h === "stderr" || lower.includes("stderr")) return "stderr_log";
  if (h === "stdout" || lower.includes("stdout")) return "stdout_log";
  if (
    lower.endsWith(".html") ||
    lower.includes("report") ||
    h === "html_report_ref"
  ) {
    return "html_report_ref";
  }
  return "attachment";
}

function displayNameFromPath(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  const last = parts[parts.length - 1];
  return last && last.trim() ? last.trim() : path.slice(0, 80);
}

function pushRef(
  out: SystemTestArtifactRef[],
  seen: Set<string>,
  ref: Omit<SystemTestArtifactRef, "isPrimary"> & { isPrimary?: boolean },
): void {
  const key = `${ref.type}\0${ref.path}`;
  if (seen.has(key)) return;
  seen.add(key);
  out.push({
    ...ref,
    isPrimary: ref.isPrimary ?? false,
  });
}

function readStringRecord(
  o: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function readNumber(o: Record<string, unknown>, key: string): number | null {
  const v = o[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return parseInt(v, 10);
  return null;
}

/**
 * Normalize Playwright / generic artifact JSON into canonical refs (best-effort).
 */
export function extractArtifactRefsFromCase(
  c: SystemTestCaseRowInput,
): SystemTestArtifactRef[] {
  const out: SystemTestArtifactRef[] = [];
  const seen = new Set<string>();
  const aj = c.artifactJson;

  const add = (
    path: string,
    typeHint?: string,
    displayName?: string,
    mimeType?: string | null,
    sizeBytes?: number | null,
  ) => {
    if (!path.trim()) return;
    const type = inferTypeFromPathAndHint(path, typeHint);
    pushRef(out, seen, {
      type,
      path: path.trim(),
      displayName: displayName ?? displayNameFromPath(path),
      mimeType: mimeType ?? null,
      sourceCaseId: c.id,
      sizeBytes: sizeBytes ?? null,
    });
  };

  if (aj != null && typeof aj === "object" && !Array.isArray(aj)) {
    const o = aj as Record<string, unknown>;
    for (const key of ["trace", "video", "screenshot"] as const) {
      const v = o[key];
      if (typeof v === "string" && v.trim()) add(v, key);
    }
    const attachments = o.attachments ?? o.attachment;
    if (Array.isArray(attachments)) {
      for (const item of attachments) {
        if (typeof item === "string" && item.trim()) {
          add(item);
        } else if (item && typeof item === "object" && !Array.isArray(item)) {
          const a = item as Record<string, unknown>;
          const p =
            readStringRecord(a, ["path", "name", "file", "url"]) ??
            (typeof a.body === "string" ? a.body : null);
          if (p) {
            add(
              p,
              readStringRecord(a, ["type", "kind"]) ?? undefined,
              readStringRecord(a, ["displayName", "title"]) ?? undefined,
              readStringRecord(a, ["mimeType", "contentType"]),
              readNumber(a, "size") ?? readNumber(a, "sizeBytes"),
            );
          }
        }
      }
    }
    const nested = o.artifacts;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      for (const [k, v] of Object.entries(nested)) {
        if (typeof v === "string" && v.trim()) add(v, k);
      }
    }
  }

  return out;
}

const RAW_WALK_MAX_DEPTH = 6;
const PATH_LIKE =
  /(\/[\w\-./]+\.(zip|png|jpe?g|webm|mp4|har|txt|log|html))|(https?:\/\/[^\s"'<>]+\.(zip|png|jpe?g|webm|mp4))/i;

function walkRawForPaths(
  node: unknown,
  depth: number,
  caseId: string,
  out: SystemTestArtifactRef[],
  seen: Set<string>,
): void {
  if (depth > RAW_WALK_MAX_DEPTH) return;
  if (typeof node === "string") {
    const s = node.trim();
    if (s.length > 4 && PATH_LIKE.test(s)) {
      const type = inferTypeFromPathAndHint(s);
      pushRef(out, seen, {
        type,
        path: s,
        displayName: displayNameFromPath(s),
        mimeType: null,
        sourceCaseId: caseId,
        sizeBytes: null,
      });
    }
    return;
  }
  if (Array.isArray(node)) {
    for (const x of node) walkRawForPaths(x, depth + 1, caseId, out, seen);
    return;
  }
  if (node != null && typeof node === "object") {
    for (const v of Object.values(node)) {
      walkRawForPaths(v, depth + 1, caseId, out, seen);
    }
  }
}

export function extractArtifactRefsFromCaseDeep(
  c: SystemTestCaseRowInput,
): SystemTestArtifactRef[] {
  const base = extractArtifactRefsFromCase(c);
  const seen = new Set(base.map((r) => `${r.type}\0${r.path}`));
  walkRawForPaths(c.rawCaseJson, 0, c.id, base, seen);
  return base;
}

function sortRefsForPrimary(refs: SystemTestArtifactRef[]): SystemTestArtifactRef[] {
  return [...refs].sort((a, b) => {
    const d = typeRank(a.type) - typeRank(b.type);
    if (d !== 0) return d;
    return a.path.localeCompare(b.path);
  });
}

/**
 * Merge artifact refs from group members; mark exactly one primary (deterministic).
 */
export function mergeArtifactRefsForGroup(
  members: SystemTestCaseRowInput[],
): {
  refs: SystemTestArtifactRef[];
  primaryRef: SystemTestArtifactRef | null;
} {
  const merged: SystemTestArtifactRef[] = [];
  const seen = new Set<string>();
  for (const m of members) {
    for (const r of extractArtifactRefsFromCaseDeep(m)) {
      pushRef(merged, seen, { ...r, isPrimary: false });
    }
  }
  const sorted = sortRefsForPrimary(merged);
  if (!sorted.length) {
    return { refs: [], primaryRef: null };
  }
  const primary = sorted[0]!;
  const refs = sorted.map((r, i) => ({
    ...r,
    isPrimary: i === 0,
  }));
  return { refs, primaryRef: { ...primary, isPrimary: true } };
}
