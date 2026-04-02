import type { IntelCase } from "./types.js";

function normalizeWhitespace(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function firstMeaningfulLine(message: string | null | undefined): string {
  if (!message) return "";
  const lines = message
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines[0] ? normalizeWhitespace(lines[0]) : "";
}

export function normalizeMessageForFingerprint(message: string): string {
  let s = normalizeWhitespace(message);
  if (!s) return "";
  s = s.replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g, "<ts>");
  s = s.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>");
  s = s.replace(/0x[0-9a-f]+/gi, "<hex>");
  s = s.replace(/:\d+:\d+/g, ":0:0");
  s = s.replace(/\(\d+:\d+\)/g, "(0:0)");
  return normalizeWhitespace(s);
}

function messageHeadForFingerprint(c: IntelCase): string {
  const raw = c.errorMessage || c.errorStack || "";
  const head = firstMeaningfulLine(raw);
  const fp = normalizeMessageForFingerprint(head);
  return fp.length > 240 ? fp.slice(0, 240) : fp;
}

export function shortMessageFromCase(c: IntelCase): string {
  const fromMsg = firstMeaningfulLine(c.errorMessage);
  if (fromMsg) return fromMsg;
  return firstMeaningfulLine(c.errorStack);
}

export function fingerprintForCase(c: IntelCase): string {
  const explicit = c.fingerprint;
  if (typeof explicit === "string" && explicit.trim()) {
    return normalizeWhitespace(explicit.trim());
  }

  const file = normalizeWhitespace(c.filePath || "unknown");
  const project = normalizeWhitespace(c.suite || "unknown");
  const title = normalizeWhitespace(c.title || c.fullName || "unknown");
  const msgHead = messageHeadForFingerprint(c);
  if (msgHead) return `${file}|${project}|${title}|${msgHead}`;
  return `${file}|${title}`;
}
