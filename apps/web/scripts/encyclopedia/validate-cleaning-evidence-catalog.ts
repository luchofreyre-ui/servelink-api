/**
 * Lightweight lint for CLEANING_EVIDENCE_CATALOG rows.
 *
 * Run from apps/web: npx tsx scripts/encyclopedia/validate-cleaning-evidence-catalog.ts
 */

import { CLEANING_EVIDENCE_CATALOG } from "../../src/lib/encyclopedia/evidence/cleaningEvidenceCatalog";
import type { EvidenceRecord } from "../../src/lib/encyclopedia/evidence/evidenceTypes";

/** Stricter targets for new rows; legacy rows may have single benchmark lines. */
const MIN_NARRATIVE_SOFT = 20;

function checkRecord(record: EvidenceRecord, index: number): string[] {
  const errs: string[] = [];
  const prefix = `Row ${index} (${record.surface} / ${record.problem})`;

  if (!record.whyItHappens?.trim()) errs.push(`${prefix}: whyItHappens empty`);
  if (!record.whyItWorks?.trim()) errs.push(`${prefix}: whyItWorks empty`);
  if (record.whyItHappens.length < MIN_NARRATIVE_SOFT) {
    errs.push(`${prefix}: whyItHappens shorter than ${MIN_NARRATIVE_SOFT} chars`);
  }
  if (record.whyItWorks.length < MIN_NARRATIVE_SOFT) {
    errs.push(`${prefix}: whyItWorks shorter than ${MIN_NARRATIVE_SOFT} chars`);
  }

  if (!Array.isArray(record.products) || record.products.length < 1) {
    errs.push(`${prefix}: need at least 1 product`);
  }

  if (!Array.isArray(record.mistakes) || record.mistakes.length < 1) {
    errs.push(`${prefix}: need at least 1 mistake`);
  }

  if (!Array.isArray(record.benchmarks) || record.benchmarks.length < 1) {
    errs.push(`${prefix}: need at least 1 benchmark`);
  }

  if (!Array.isArray(record.professionalInsights) || record.professionalInsights.length < 1) {
    errs.push(`${prefix}: need at least 1 professional insight`);
  }

  if (!Array.isArray(record.sources) || record.sources.length < 1 || record.sources.some((s) => !s.trim())) {
    errs.push(`${prefix}: sources must be non-empty strings`);
  }

  return errs;
}

function main() {
  const failures: string[] = [];
  CLEANING_EVIDENCE_CATALOG.forEach((row, i) => {
    failures.push(...checkRecord(row, i));
  });

  if (failures.length) {
    console.error("Evidence catalog validation failed:\n");
    for (const f of failures) console.error(f);
    process.exit(1);
  }

  console.log(`OK: ${CLEANING_EVIDENCE_CATALOG.length} evidence rows passed validation.`);
}

main();
