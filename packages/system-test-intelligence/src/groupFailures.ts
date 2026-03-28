import { fingerprintForCase, shortMessageFromCase } from "./fingerprint";
import { isFailedStatus } from "./status";
import type { FailureGroup, IntelCase } from "./types";

export function groupFailures(cases: IntelCase[]): FailureGroup[] {
  const failed = cases.filter((c) => isFailedStatus(c.status));
  const map = new Map<string, FailureGroup>();

  for (const c of failed) {
    const key = fingerprintForCase(c);
    const file = c.filePath || "unknown";
    const title = c.title?.trim() || c.fullName?.trim() || "unknown";
    const shortMessage = shortMessageFromCase(c);
    const label = c.fullName?.trim() || c.title?.trim() || title;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        file,
        title,
        shortMessage,
        occurrences: 1,
        testTitles: [label],
      });
    } else {
      existing.occurrences += 1;
      if (!existing.testTitles.includes(label)) existing.testTitles.push(label);
    }
  }

  for (const g of map.values()) {
    g.testTitles = [...new Set(g.testTitles)].sort((a, b) => a.localeCompare(b));
  }

  return [...map.values()].sort((a, b) => {
    if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
    const f = a.file.localeCompare(b.file);
    if (f !== 0) return f;
    return a.title.localeCompare(b.title);
  });
}
