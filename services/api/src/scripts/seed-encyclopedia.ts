import path from "path";
import fs from "fs";
import { PrismaService } from "../prisma";
import { EncyclopediaAdminService } from "../modules/encyclopedia/admin/encyclopedia-admin.service";
import { ingestWithValidation } from "../modules/encyclopedia/ingestion/ingestionWithValidation.server";
import {
  getAllReviewRecords,
  markPromotionSucceeded,
  markReviewApproved,
} from "../modules/encyclopedia/review/reviewStore.server";
import { saveReviewedCandidatesToApiStore } from "../modules/encyclopedia/review/reviewedCandidatesIntake.server";
import type { CanonicalPageSnapshot } from "../modules/encyclopedia/canonical/canonicalTypes";

type GeneratedPage = {
  title: string;
  slug: string;
  meta: {
    problem: string;
    surface: string;
    intent: string;
    riskLevel: "low" | "medium" | "high";
    needsChemicalExplanation: boolean;
    needsMaterialSpecifics: boolean;
  };
  sections: Array<{ key: string; title: string; required: boolean }>;
  content: {
    title: string;
    slug: string;
    sections: Array<{ key: string; content: string }>;
    advancedNotes?: string;
  };
  internalLinks: string[];
};

type EvidenceRecord = {
  method?: {
    tools?: string[];
    dwell?: string;
    agitation?: string;
    rinse?: string;
    dry?: string;
  };
  recommendedChemistry?: string;
  whyItWorks?: string;
  whyItHappens?: string;
  mistakes?: string[];
  benchmarks?: string[];
};

type WebPipeline = {
  buildCanonicalPageSnapshotFromGeneratedPage: (
    page: GeneratedPage,
  ) => CanonicalPageSnapshot;
  transformSnapshotToStructured: (snapshot: CanonicalPageSnapshot) => unknown;
  resolveEvidence: (surface: string, problem: string) => EvidenceRecord | null;
};

const SEED_SLUGS = [
  "hard-water-stains",
  "soap-scum",
  "mold-growth",
] as const;

const REQUIRED_SECTION_KEYS = [
  "whatIs",
  "whyItHappens",
  "whereItAppears",
  "howToFix",
  "whatToAvoid",
  "whatToExpect",
] as const;

const SECTION_TITLES: Record<(typeof REQUIRED_SECTION_KEYS)[number], string> = {
  whatIs: "What this problem is",
  whyItHappens: "Why this happens",
  whereItAppears: "Where it appears",
  howToFix: "How to fix",
  whatToAvoid: "What to avoid",
  whatToExpect: "What to expect",
};

function installWebAliasResolver(repoRoot: string): () => void {
  const Module = require("module") as {
    _resolveFilename: (
      request: string,
      parent: NodeModule | null,
      isMain: boolean,
      options?: unknown,
    ) => string;
  };
  const originalResolveFilename = Module._resolveFilename;

  Module._resolveFilename = function resolveFilename(
    this: unknown,
    request: string,
    parent: NodeModule | null,
    isMain: boolean,
    options?: unknown,
  ): string {
    if (request.startsWith("@/")) {
      const webSrcPath = path.join(
        repoRoot,
        "apps/web/src",
        request.slice(2),
      );
      return originalResolveFilename.call(
        this,
        webSrcPath,
        parent,
        isMain,
        options,
      );
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  return () => {
    Module._resolveFilename = originalResolveFilename;
  };
}

function installWebTsTranspiler(repoRoot: string): () => void {
  const webSrcRoot = path.join(repoRoot, "apps/web/src");
  const originalTsExtension = require.extensions[".ts"];
  const ts = require("typescript") as typeof import("typescript");

  require.extensions[".ts"] = (
    module: NodeJS.Module,
    filename: string,
  ): void => {
    if (!filename.startsWith(webSrcRoot)) {
      if (originalTsExtension) {
        originalTsExtension(module, filename);
        return;
      }
      throw new Error(`No TypeScript loader registered for ${filename}`);
    }

    const source = fs.readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        allowJs: true,
        jsx: ts.JsxEmit.Preserve,
      },
      fileName: filename,
    });

    (module as NodeJS.Module & {
      _compile: (content: string, filename: string) => void;
    })._compile(output.outputText, filename);
  };

  return () => {
    require.extensions[".ts"] = originalTsExtension;
  };
}

function loadWebPipeline(): WebPipeline {
  const repoRoot = path.resolve(__dirname, "../../../..");
  const restoreAliasResolver = installWebAliasResolver(repoRoot);
  const restoreWebTsTranspiler = installWebTsTranspiler(repoRoot);

  try {
    const pipelineMerge = require(path.join(
      repoRoot,
      "apps/web/src/lib/encyclopedia/encyclopediaPipelineMerge.ts",
    )) as Pick<WebPipeline, "buildCanonicalPageSnapshotFromGeneratedPage">;
    const structuredTransformer = require(path.join(
      repoRoot,
      "apps/web/src/lib/encyclopedia/structuredTransformer.ts",
    )) as Pick<WebPipeline, "transformSnapshotToStructured">;
    const evidenceResolver = require(path.join(
      repoRoot,
      "apps/web/src/lib/encyclopedia/evidence/evidenceResolver.ts",
    )) as Pick<WebPipeline, "resolveEvidence">;

    return {
      buildCanonicalPageSnapshotFromGeneratedPage:
        pipelineMerge.buildCanonicalPageSnapshotFromGeneratedPage,
      transformSnapshotToStructured:
        structuredTransformer.transformSnapshotToStructured,
      resolveEvidence: evidenceResolver.resolveEvidence,
    };
  } finally {
    restoreWebTsTranspiler();
    restoreAliasResolver();
  }
}

function requireEvidence(
  resolveEvidence: WebPipeline["resolveEvidence"],
  surface: string,
  problem: string,
): EvidenceRecord {
  const evidence = resolveEvidence(surface, problem);
  if (!evidence) {
    throw new Error(`Missing encyclopedia evidence for ${surface} / ${problem}`);
  }
  return evidence;
}

function sentenceFromList(items: string[] | undefined, fallback: string): string {
  if (!items?.length) return fallback;
  return items.slice(0, 2).join("; ");
}

function buildSeedPage(args: {
  slug: (typeof SEED_SLUGS)[number];
  title: string;
  surface: string;
  problem: string;
  intent: string;
  riskLevel: "low" | "medium" | "high";
  internalLinks: string[];
  evidence: EvidenceRecord;
  copy: Record<(typeof REQUIRED_SECTION_KEYS)[number], string>;
}): GeneratedPage {
  return {
    title: args.title,
    slug: args.slug,
    meta: {
      problem: args.problem,
      surface: args.surface,
      intent: args.intent,
      riskLevel: args.riskLevel,
      needsChemicalExplanation: true,
      needsMaterialSpecifics: true,
    },
    sections: REQUIRED_SECTION_KEYS.map((key) => ({
      key,
      title: SECTION_TITLES[key],
      required: true,
    })),
    content: {
      title: args.title,
      slug: args.slug,
      sections: REQUIRED_SECTION_KEYS.map((key) => ({
        key,
        content: args.copy[key],
      })),
      advancedNotes: [
        `Recommended chemistry: ${args.evidence.recommendedChemistry ?? "surface-compatible cleaner"}.`,
        `Tools: ${sentenceFromList(args.evidence.method?.tools, "microfiber and non-scratch agitation tools")}.`,
        `Success benchmark: ${sentenceFromList(args.evidence.benchmarks, "surface looks cleaner after full dry-down")}.`,
      ].join(" "),
    },
    internalLinks: args.internalLinks,
  };
}

function buildSeedPages(resolveEvidence: WebPipeline["resolveEvidence"]): GeneratedPage[] {
  const hardWaterEvidence = requireEvidence(
    resolveEvidence,
    "glass",
    "hard water stains",
  );
  const soapScumEvidence = requireEvidence(
    resolveEvidence,
    "grout",
    "soap scum",
  );
  const moldEvidence = requireEvidence(resolveEvidence, "grout", "mold growth");

  return [
    buildSeedPage({
      slug: "hard-water-stains",
      title: "Hard Water Stains",
      surface: "Glass shower doors",
      problem: "Hard water stains",
      intent: "how-remove",
      riskLevel: "medium",
      internalLinks: ["soap-scum", "mold-growth"],
      evidence: hardWaterEvidence,
      copy: {
        whatIs:
          "Hard water stains are removable mineral films that dry onto glass after repeated splash and evaporation. They often look cloudy or white and can be mistaken for etching, so the first job is to confirm whether the surface still feels smooth.",
        whyItHappens:
          `${hardWaterEvidence.whyItHappens ?? "Hard water leaves calcium and magnesium minerals behind as droplets evaporate."} Repeated wet-dry cycles stack that residue near lower panels, trim lines, and splash paths until normal glass cleaning only smears it.`,
        whereItAppears:
          "Hard water stains most often appear on shower glass, tile edges, chrome fixtures, and sink-adjacent splash zones. The heaviest deposits show up where water runs slowly, pools at seams, or dries without towel removal.",
        howToFix:
          `${hardWaterEvidence.whyItWorks ?? "A compatible mild acidic cleaner dissolves mineral residue while controlled agitation lifts the softened film."} Work small areas, rinse thoroughly, and dry fully before deciding whether another controlled pass is needed.`,
        whatToAvoid:
          `Avoid abrasive powders, razor scraping on coated glass, and broad acid use near untested stone or metal trim. ${sentenceFromList(hardWaterEvidence.mistakes, "Skipping the rinse can let loosened salts dry back onto the surface.")}`,
        whatToExpect:
          "Expect gradual clarity improvement after dwell, agitation, rinse, and a complete dry-down. If the glass still looks frosted after the film is gone, the remaining haze may be permanent etching rather than cleanable residue.",
      },
    }),
    buildSeedPage({
      slug: "soap-scum",
      title: "Soap Scum",
      surface: "Shower tile and grout",
      problem: "Soap scum",
      intent: "how-clean",
      riskLevel: "medium",
      internalLinks: ["hard-water-stains", "mold-growth"],
      evidence: soapScumEvidence,
      copy: {
        whatIs:
          "Soap scum is a sticky bath film formed from soap residue, body oils, minerals, and rinse water. It dulls tile and grout before it becomes thick, and it can hold odor or discoloration when cleaning only skims the surface.",
        whyItHappens:
          `${soapScumEvidence.whyItHappens ?? "Soap and hard water minerals bond as shower water evaporates."} Warm humidity and incomplete rinsing let the residue rebuild in layers, especially around grout lines and lower-wall splash zones.`,
        whereItAppears:
          "Soap scum appears on shower glass, ceramic tile, grout, tubs, ledges, and hardware where body products collect. Corners, door tracks, and texture lows usually show the first visible film because rinse water slows there.",
        howToFix:
          `${soapScumEvidence.whyItWorks ?? "The right bath cleaner breaks the soap-mineral bond so agitation can release the film."} Apply controlled dwell, scrub with non-damaging tools, rinse until slickness is gone, and dry before judging color.`,
        whatToAvoid:
          `Avoid adding oily cleaners, waxes, or heavy perfume products that leave a new gripping layer. ${sentenceFromList(soapScumEvidence.mistakes, "Avoid using only glass cleaner when the residue is seated in grout or textured tile.")}`,
        whatToExpect:
          "Expect a cleaner feel before perfect color returns, because grout and corners may need a second controlled pass. If staining remains after the film is gone, evaluate whether mildew, mineral scale, or worn grout is now exposed.",
      },
    }),
    buildSeedPage({
      slug: "mold-growth",
      title: "Mold Growth",
      surface: "Bathroom grout and damp surfaces",
      problem: "Mold growth",
      intent: "how-fix",
      riskLevel: "high",
      internalLinks: ["soap-scum", "hard-water-stains"],
      evidence: moldEvidence,
      copy: {
        whatIs:
          "Mold growth is a moisture-driven biological problem, not just a dark stain. On household surfaces it usually sits in soil, grout texture, caulk edges, or porous material that stays damp long enough to support regrowth.",
        whyItHappens:
          `${moldEvidence.whyItHappens ?? "Chronic moisture, organic residue, and slow drying let mold establish on vulnerable surfaces."} Soap film and hard water residue can feed or shelter the growth when ventilation and dry-down are weak.`,
        whereItAppears:
          "Mold growth appears on grout, caulk, painted corners, window tracks, stone texture, and other areas that stay damp after use. It is common at lower shower joints, behind bottles, and near failed seals or leaks.",
        howToFix:
          `${moldEvidence.whyItWorks ?? "Physical soil removal plus a labeled disinfecting step improves contact with the organisms."} Clean the organic film first, follow dwell directions, rinse as required, and correct the moisture condition that allowed growth.`,
        whatToAvoid:
          `Avoid painting, sealing, or caulking over active growth because that hides the source without removing it. ${sentenceFromList(moldEvidence.mistakes, "Avoid mixing chemicals or using unlabeled dwell times in enclosed bathrooms.")}`,
        whatToExpect:
          "Expect visible improvement only if soil removal, contact time, and dry-down all happen together. Deep staining, failed caulk, or moisture behind the surface may need repair after cleaning removes the active surface film.",
      },
    }),
  ];
}

function assertSnapshotsAreSeedable(snapshots: CanonicalPageSnapshot[]) {
  const validSlugs = new Set(snapshots.map((snapshot) => snapshot.slug));

  for (const snapshot of snapshots) {
    for (const key of REQUIRED_SECTION_KEYS) {
      const section = snapshot.sections.find((candidate) => candidate.key === key);
      if (!section) {
        throw new Error(`${snapshot.slug} missing required section ${key}`);
      }
      if (section.content.trim().length <= 80) {
        throw new Error(`${snapshot.slug} section ${key} must exceed 80 chars`);
      }
    }

    const links = snapshot.internalLinks ?? [];
    if (links.length < 1) {
      throw new Error(`${snapshot.slug} must include at least one internal link`);
    }

    for (const link of links) {
      if (!validSlugs.has(link)) {
        throw new Error(`${snapshot.slug} links to unknown slug ${link}`);
      }
    }
  }
}

async function seedReviewStore(snapshots: CanonicalPageSnapshot[]) {
  const existingSlugs = new Set(getAllReviewRecords().map((record) => record.slug));
  const missing = snapshots.filter((snapshot) => !existingSlugs.has(snapshot.slug));

  if (missing.length === 0) {
    return { created: 0, skipped: snapshots.length };
  }

  const result = saveReviewedCandidatesToApiStore(
    missing.map((snapshot) => ({
      slug: snapshot.slug,
      title: snapshot.title,
      canonicalSnapshot: snapshot,
      sourceName: "ci_seed_encyclopedia",
    })),
  );

  for (const snapshot of missing) {
    markReviewApproved(snapshot.slug);
    markPromotionSucceeded(snapshot.slug);
  }

  return { created: result.created, skipped: snapshots.length - missing.length };
}

async function seedPrismaReviewRecords(
  prisma: PrismaService,
  snapshots: CanonicalPageSnapshot[],
) {
  const existing = await prisma.encyclopediaReviewRecord.findMany({
    where: { slug: { in: snapshots.map((snapshot) => snapshot.slug) } },
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((record) => record.slug));
  const missing = snapshots.filter((snapshot) => !existingSlugs.has(snapshot.slug));

  if (missing.length === 0) {
    return { inserted: 0, skipped: snapshots.length };
  }

  const adminService = new EncyclopediaAdminService(prisma);
  const result = await adminService.intakeGeneratedRecords(
    missing.map((snapshot) => ({
      slug: snapshot.slug,
      title: snapshot.title,
      surface: snapshot.surface,
      problem: snapshot.problem,
      intent: snapshot.intent,
      sections: snapshot.sections,
      internalLinks: snapshot.internalLinks ?? [],
    })),
  );

  return {
    inserted: result.inserted,
    skipped: snapshots.length - missing.length + result.skipped,
  };
}

async function main() {
  const {
    buildCanonicalPageSnapshotFromGeneratedPage,
    transformSnapshotToStructured,
    resolveEvidence,
  } = loadWebPipeline();

  const snapshots = buildSeedPages(resolveEvidence).map((page) =>
    buildCanonicalPageSnapshotFromGeneratedPage(page),
  );
  assertSnapshotsAreSeedable(snapshots);

  for (const snapshot of snapshots) {
    transformSnapshotToStructured(snapshot);
  }

  const { accepted, rejected } = await ingestWithValidation(snapshots);
  if (rejected.length > 0) {
    throw new Error(
      `Seed snapshots failed generation validation: ${JSON.stringify(rejected)}`,
    );
  }

  const prisma = new PrismaService();
  try {
    await prisma.$connect();
    const [reviewStoreResult, prismaResult] = await Promise.all([
      seedReviewStore(accepted),
      seedPrismaReviewRecords(prisma, accepted),
    ]);

    console.log(
      JSON.stringify(
        {
          ok: true,
          slugs: accepted.map((snapshot) => snapshot.slug),
          reviewStore: reviewStoreResult,
          prisma: prismaResult,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error("ENCYCLOPEDIA_SEED_FAILED", error);
  process.exit(1);
});
