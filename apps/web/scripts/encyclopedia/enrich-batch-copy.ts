import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { encyclopediaBatchFileSchema } from "../../src/lib/encyclopedia/schema";
import type { EncyclopediaBatchPage } from "../../src/lib/encyclopedia/types";
import { readJsonFile } from "./utils";

type Args = {
  inputPath: string;
  outputPath: string;
};

type BatchFile = {
  pages: EncyclopediaBatchPage[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv: string[]): Args {
  const inputArg = argv.find((arg) => arg.startsWith("--input="));
  const outputArg = argv.find((arg) => arg.startsWith("--output="));

  if (!inputArg) {
    throw new Error(
      "Missing --input=content-batches/encyclopedia/your-batch.json",
    );
  }

  if (!outputArg) {
    throw new Error(
      "Missing --output=content-batches/encyclopedia/your-refined-batch.json",
    );
  }

  return {
    inputPath: path.resolve(repoRoot, inputArg.slice("--input=".length)),
    outputPath: path.resolve(repoRoot, outputArg.slice("--output=".length)),
  };
}

function writeJsonFile(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function toReadableTopic(slug: string): string {
  return slug.replace(/-/g, " ");
}

function buildSurfaceSignal(page: EncyclopediaBatchPage): string {
  const slug = page.slug.toLowerCase();

  if (slug.includes("grout")) return "grout lines, porous joints, and adjacent hard surfaces";
  if (slug.includes("shower-glass") || slug.includes("glass")) return "glass and mirrored surfaces";
  if (slug.includes("stainless")) return "stainless steel and brushed metal";
  if (slug.includes("finished-wood") || slug.includes("wood")) return "finished wood and moisture-sensitive coatings";
  if (slug.includes("tile")) return "tile surfaces, grout edges, and textured floor planes";
  if (slug.includes("floor")) return "finished floors, traffic lanes, and edges";
  if (slug.includes("countertop") || slug.includes("counter")) return "countertops and food-contact prep areas";

  return "the affected surface and its surrounding contact zones";
}

function buildSoilSignal(page: EncyclopediaBatchPage): string {
  const slug = page.slug.toLowerCase();
  const title = page.title.toLowerCase();

  if (slug.includes("grease") || title.includes("grease")) {
    return "oil-based residue, cooking aerosols, and sticky particulate loading";
  }
  if (slug.includes("film") || title.includes("film")) {
    return "surfactant film, polymer residue, and incomplete product pickup";
  }
  if (slug.includes("residue") || title.includes("residue")) {
    return "left-behind cleaner residue, dissolved solids, and redeposition";
  }
  if (slug.includes("haze") || title.includes("haze")) {
    return "diffuse haze from film, wear, micro-residue, or mineral contamination";
  }
  if (slug.includes("sticky") || title.includes("sticky")) {
    return "tacky residues, sugar soils, and concentrated detergent film";
  }

  return "surface soils, product residue, and material-specific contamination";
}

function buildSummary(page: EncyclopediaBatchPage): string {
  const topic = page.title;
  const soilSignal = buildSoilSignal(page);
  const surfaceSignal = buildSurfaceSignal(page);

  if (page.category === "problems") {
    return `${topic} usually comes from ${soilSignal} interacting with ${surfaceSignal}. This page explains what causes it, what makes it worse, and how professionals diagnose and correct it without creating secondary haze, tackiness, or damage.`;
  }

  if (page.category === "methods") {
    return `${topic} is a professional cleaning approach used when ${soilSignal} must be removed safely from ${surfaceSignal}. This page explains where the method fits, what people get wrong, and how to sequence it correctly.`;
  }

  return `${topic} requires surface-aware cleaning because ${soilSignal} behaves differently across ${surfaceSignal}. This page explains professional handling, common mistakes, and material-specific considerations.`;
}

function buildPrimaryAlt(page: EncyclopediaBatchPage): string {
  return `${page.title} shown under angled inspection light on ${buildSurfaceSignal(page)}`;
}

function buildImageQueries(page: EncyclopediaBatchPage): string[] {
  const topic = toReadableTopic(page.slug);
  const title = page.title.toLowerCase();

  return [
    `${topic} professional cleaning`,
    `${title} before after cleaning`,
    `${topic} residue surface inspection`,
  ];
}

function buildWhatThisIs(page: EncyclopediaBatchPage): string {
  return `${page.title} is a practical cleaning condition professionals identify by looking at how ${buildSoilSignal(page)} presents on ${buildSurfaceSignal(page)}. In the field, it usually shows up as a repeatable visual pattern, drag, haze, tackiness, or uneven reflectivity rather than as a random isolated mark.`;
}

function buildWhyItHappens(page: EncyclopediaBatchPage): string {
  return `The issue usually develops when ${buildSoilSignal(page)} is allowed to accumulate, partially dry, or get redistributed during maintenance. Surface texture, finish sensitivity, humidity, rinse behavior, and prior product history all influence whether the problem stays light and cosmetic or becomes a recurring cleaning failure.`;
}

function buildWhatPeopleDoWrong(page: EncyclopediaBatchPage): string {
  return `Most people make ${page.title.toLowerCase()} worse by using too much product, the wrong chemistry, overly wet towels or pads, poor rinse discipline, or repeated wipe passes with already-loaded cloth faces. They often chase the visible symptom without separating true soil, cleaner residue, and actual surface damage.`;
}

function buildProfessionalMethod(page: EncyclopediaBatchPage): string {
  return `A professional approach starts with identifying the material, the likely residue or soil family, and whether the surface can tolerate moisture, agitation, or stronger chemistry. From there, the work is done in controlled test areas, with measured application, clean pickup, towel or pad rotation, and a final visual check under directional light to confirm the issue is actually resolved rather than temporarily disguised.`;
}

function buildDataAndBenchmarks(page: EncyclopediaBatchPage): string {
  return `Useful benchmarks include how evenly the surface dries, whether reflectivity improves across multiple adjacent passes, whether tackiness or drag returns after full dry-down, and whether the result holds when viewed from different lighting angles. Professionals also compare test zones so they can distinguish film removal from simple temporary wetting improvement.`;
}

function buildProfessionalInsights(page: EncyclopediaBatchPage): string {
  return `One of the best professional clues is distribution: when the issue is concentrated around handles, splash zones, edges, grout lines, traffic lanes, or appliance fronts, the pattern usually tells you whether you are dealing with product buildup, environmental soil, or a surface-specific compatibility problem.`;
}

function buildWhenToCallAProfessional(page: EncyclopediaBatchPage): string {
  return `Call a professional when the surface is specialty-coated, natural stone, black stainless, factory-finished wood, high glass, unknown material, or already affected by repeated failed cleaning attempts. Professional help is also the right move when the issue keeps returning after careful cleaning, which usually means the root cause has not actually been isolated.`;
}

function buildRelatedTopics(page: EncyclopediaBatchPage): string[] {
  return page.sections.related_topics.slice(0, 3);
}

function enrichPage(page: EncyclopediaBatchPage): EncyclopediaBatchPage {
  return {
    ...page,
    summary: buildSummary(page),
    image: {
      primaryAlt: buildPrimaryAlt(page),
      queries: buildImageQueries(page),
    },
    sections: {
      ...page.sections,
      what_this_is: buildWhatThisIs(page),
      why_it_happens: buildWhyItHappens(page),
      what_people_do_wrong: buildWhatPeopleDoWrong(page),
      professional_method: buildProfessionalMethod(page),
      data_and_benchmarks: buildDataAndBenchmarks(page),
      professional_insights: buildProfessionalInsights(page),
      when_to_call_a_professional: buildWhenToCallAProfessional(page),
      related_topics: buildRelatedTopics(page),
    },
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const raw = readJsonFile<unknown>(args.inputPath);
  const batch = encyclopediaBatchFileSchema.parse(raw) as BatchFile;

  const enriched: BatchFile = {
    pages: batch.pages.map(enrichPage),
  };

  writeJsonFile(args.outputPath, enriched);

  console.log("Batch enrichment summary");
  console.log(
    JSON.stringify(
      {
        inputPath: path.relative(repoRoot, args.inputPath),
        outputPath: path.relative(repoRoot, args.outputPath),
        pageCount: enriched.pages.length,
      },
      null,
      2,
    ),
  );

  console.log("\nPages:");
  for (const page of enriched.pages) {
    console.log(`- ${page.id} | ${page.slug} | ${page.category} | ${page.cluster}`);
  }
}

main();
