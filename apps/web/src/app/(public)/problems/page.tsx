import type { Metadata } from "next";
import Link from "next/link";
import { getAllProblemPages } from "@/authority/data/authorityProblemPageData";
import { buildAuthorityProblemsIndexMetadata } from "@/authority/metadata/authorityMetadata";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@/authority/metadata/authoritySchema";
import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import {
  ProblemsHubExperience,
  type EditorialProblemCard,
} from "@/components/knowledge/ProblemsHubExperience";
import {
  getEncyclopediaDocumentByCategoryAndSlug,
  getPublishedEncyclopediaEntriesByCategory,
} from "@/lib/encyclopedia/loader";

export const metadata: Metadata = buildAuthorityProblemsIndexMetadata();

const PROBLEMS_TITLE = "Cleaning problems";
const PROBLEMS_DESCRIPTION =
  "Problem definitions linked to methods, surfaces, and combo playbooks.";

function pipelineProblemSummary(slug: string): string {
  const doc = getEncyclopediaDocumentByCategoryAndSlug("problems", slug);
  return doc?.frontmatter.summary?.trim() ?? "";
}

export default function ProblemsIndexPage() {
  const legacyProblems = getAllProblemPages();
  const pipelineProblems = getPublishedEncyclopediaEntriesByCategory("problems");
  const legacySlugs = new Set(legacyProblems.map((problem) => problem.slug));
  const pipelineOnlyProblems = pipelineProblems.filter((entry) => !legacySlugs.has(entry.slug));
  const pipelineBySlug = new Map(pipelineProblems.map((entry) => [entry.slug, entry]));

  const problems: EditorialProblemCard[] = [
    ...legacyProblems.map((problem) => ({
      slug: problem.slug,
      title: problem.title,
      summary: problem.summary,
      href: `/problems/${problem.slug}`,
      imageSrc: pipelineBySlug.get(problem.slug)?.imageAssetPath ?? null,
    })),
    ...pipelineOnlyProblems.map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      summary: pipelineProblemSummary(entry.slug),
      href: `/problems/${entry.slug}`,
      imageSrc: entry.imageAssetPath,
    })),
  ].sort((a, b) => a.title.localeCompare(b.title));

  const indexJsonLd = [
    buildBreadcrumbListSchema([
      { label: "Home", href: "/" },
      { label: "Cleaning encyclopedia", href: "/encyclopedia" },
      { label: PROBLEMS_TITLE, href: "/problems" },
    ]),
    buildCollectionPageSchema({
      title: PROBLEMS_TITLE,
      description: PROBLEMS_DESCRIPTION,
      path: "/problems",
    }),
  ];

  const bottomSections = (
    <>
      <section className="rounded-[18px] border border-[#E8DFD0]/90 bg-white/75 p-6 font-[var(--font-manrope)] text-sm text-[#475569]">
        <h2 className="font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">Core guides</h2>
        <ul className="mt-4 space-y-3">
          <li>
            <Link href="/guides/how-to-remove-stains-safely" className="font-semibold text-[#0D9488] hover:underline">
              How to remove stains safely
            </Link>
          </li>
          <li>
            <Link href="/guides/why-cleaning-fails" className="font-semibold text-[#0D9488] hover:underline">
              Why cleaning fails
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-[18px] border border-[#E8DFD0]/90 bg-white/75 p-6 font-[var(--font-manrope)] text-sm text-[#475569]">
        <p>
          <Link href="/compare/problems" className="font-semibold text-[#0D9488] hover:underline">
            Compare problems
          </Link>{" "}
          — structured “vs” pages from the authority graph.
        </p>
        <ul className="mt-4 space-y-3">
          <li>
            <Link
              href="/clusters/mineral-buildup-and-hard-water"
              className="font-semibold text-[#0D9488] hover:underline"
            >
              Mineral buildup and hard water (cluster)
            </Link>
          </li>
          <li>
            <Link href="/clusters/oil-and-kitchen-residue" className="font-semibold text-[#0D9488] hover:underline">
              Oil and kitchen residue (cluster)
            </Link>
          </li>
          <li>
            <Link href="/clusters/damage-and-finish-risk" className="font-semibold text-[#0D9488] hover:underline">
              Damage and finish risk (cluster)
            </Link>
          </li>
        </ul>
      </section>
    </>
  );

  return (
    <ProblemsHubExperience
      problems={problems}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Encyclopedia", href: "/encyclopedia" },
        { label: "Problems" },
      ]}
      jsonLdSlot={<AuthorityJsonLd data={indexJsonLd} />}
      bottomSections={bottomSections}
    />
  );
}
