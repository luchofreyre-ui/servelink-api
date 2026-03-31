import type { CanonicalPageSnapshot } from "./encyclopediaPipelineTypes";
import type { EncyclopediaDocument } from "./types";

function isCanonicalSnapshot(
  content: CanonicalPageSnapshot | EncyclopediaDocument
): content is CanonicalPageSnapshot {
  return typeof content === "object" && content !== null && !("frontmatter" in content);
}

/** Minimal structured render for pipeline snapshots; legacy uses markdown sections. */
export function renderCanonicalContent(
  content: CanonicalPageSnapshot | EncyclopediaDocument | null | undefined
): string {
  if (!content) return "";

  if (typeof content === "string") return content;

  if (isCanonicalSnapshot(content)) {
    const parts = content.sections.map(
      (s) => `## ${s.title}\n\n${s.content}`.trim()
    );
    if (content.advancedNotes) {
      parts.push(`## Advanced notes\n\n${content.advancedNotes}`.trim());
    }
    return parts.join("\n\n---\n\n");
  }

  const doc = content as EncyclopediaDocument;
  return doc.sections
    .map((s) => `## ${s.heading}\n\n${s.body}`.trim())
    .join("\n\n---\n\n");
}
