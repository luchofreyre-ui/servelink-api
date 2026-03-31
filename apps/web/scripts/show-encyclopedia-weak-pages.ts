/* eslint-disable no-console */

import { buildStoredAdminReviewPages } from "../src/lib/encyclopedia/adminPipeline.server";
import { buildWeakPageRepairWorkflow } from "../src/lib/encyclopedia/repairWorkflow.server";

function splitWeakPageSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeWeakPageSentence(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getRepeatedSectionKeys(
  sections: Array<{ key: string; content: string }>,
): string[] {
  return sections
    .filter((section) => {
      const sentences = splitWeakPageSentences(section.content).map(
        normalizeWeakPageSentence,
      );
      const unique = new Set(sentences).size;
      return sentences.length >= 3 && unique / sentences.length < 0.8;
    })
    .map((section) => section.key);
}

function main() {
  const weak = buildWeakPageRepairWorkflow();
  const bySlug = new Map(
    buildStoredAdminReviewPages().map((p) => [p.slug, p]),
  );

  const enriched = weak.map((record) => {
    const page = bySlug.get(record.slug);
    const repeatedSectionKeys = page
      ? getRepeatedSectionKeys(page.sections)
      : [];
    const repetitionSignal =
      repeatedSectionKeys.length > 0
        ? `repetition:${repeatedSectionKeys.join(",")}`
        : null;
    return {
      ...record,
      repetitionSectionKeys,
      repetitionSignal,
    };
  });

  console.log(JSON.stringify(enriched, null, 2));
}

main();
