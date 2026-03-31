import path from "node:path";

import fs from "node:fs";
import { NextResponse } from "next/server";

import { intakeReviewedCandidates } from "@/lib/api/encyclopediaReview";
import { reviewedCandidatesFileToApiInputs } from "@/lib/encyclopedia/reviewedCandidatesApiIntakeMap";
import {
  parseReviewedCandidatesFile,
  summarizeReviewedCandidates,
} from "@/lib/encyclopedia/reviewedCandidatesQueue";
import { loadReviewedCandidatesForSource } from "@/lib/encyclopedia/reviewedCandidatesServer";
import {
  getReviewedCandidatesSourceConfig,
  parseReviewedCandidatesSourceKey,
  type ReviewedCandidatesSourceKey,
} from "@/lib/encyclopedia/reviewedCandidatesSources";

const MASTER_INDEX = path.join(
  process.cwd(),
  "src",
  "content",
  "encyclopedia",
  "_index",
  "master-index.json",
);

function readJsonIfExists(filePath: string): unknown | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  } catch {
    return null;
  }
}

function loadMasterNormalizedSlugs(): Set<string> {
  const raw = readJsonIfExists(MASTER_INDEX);
  if (!Array.isArray(raw)) {
    return new Set();
  }
  const slugs = new Set<string>();
  for (const row of raw) {
    if (
      row &&
      typeof row === "object" &&
      "slug" in row &&
      typeof (row as { slug: string }).slug === "string"
    ) {
      slugs.add((row as { slug: string }).slug);
    }
  }
  return slugs;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceKey = parseReviewedCandidatesSourceKey(searchParams.get("sourceKey"));
  const forceOriginal = searchParams.get("source") === "original";

  const result = loadReviewedCandidatesForSource(process.cwd(), sourceKey, forceOriginal);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const config = getReviewedCandidatesSourceConfig(sourceKey);
  const existingNormalizedSlugs = [...loadMasterNormalizedSlugs()];

  return NextResponse.json({
    sourceKey,
    sourceLabel: config.label,
    file: result.file,
    loadedFrom: result.loadedFrom,
    sourcePath: result.sourcePathRel,
    editedPath: result.editedPathRel,
    existingNormalizedSlugs,
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  if (!("file" in b)) {
    return NextResponse.json(
      { error: "Body must include { sourceKey, file }" },
      { status: 400 },
    );
  }

  if (b.sourceKey !== "standard" && b.sourceKey !== "expanded") {
    return NextResponse.json(
      { error: 'Body must include sourceKey: "standard" | "expanded"' },
      { status: 400 },
    );
  }
  const sourceKey = b.sourceKey as ReviewedCandidatesSourceKey;

  let file;
  try {
    file = parseReviewedCandidatesFile(b.file);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid file";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  file.summary = summarizeReviewedCandidates(file.candidates);

  try {
    const candidates = reviewedCandidatesFileToApiInputs(file, sourceKey);
    const result = await intakeReviewedCandidates(candidates);
    return NextResponse.json({
      ok: true,
      sourceKey,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync reviewed candidates to API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
