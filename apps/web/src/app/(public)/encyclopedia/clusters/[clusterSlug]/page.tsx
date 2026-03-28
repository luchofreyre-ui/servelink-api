import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicEncyclopediaClusterHub } from "@/components/encyclopedia/PublicEncyclopediaClusterHub";
import {
  getEncyclopediaClusterRollup,
  getEncyclopediaClusterSlugs,
} from "@/lib/encyclopedia/loader";

export function generateStaticParams() {
  return getEncyclopediaClusterSlugs().map((clusterSlug) => ({ clusterSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clusterSlug: string }>;
}): Promise<Metadata> {
  const { clusterSlug } = await params;
  const rollup = getEncyclopediaClusterRollup(clusterSlug);
  if (!rollup) return {};
  return {
    title: `${rollup.title} — Topic cluster | Encyclopedia`,
    description: rollup.intro.slice(0, 158),
  };
}

export default async function EncyclopediaClusterPage({
  params,
}: {
  params: Promise<{ clusterSlug: string }>;
}) {
  const { clusterSlug } = await params;
  const rollup = getEncyclopediaClusterRollup(clusterSlug);
  if (!rollup) return notFound();

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="border-b border-[#C9B27C]/10 bg-[#FFF9F3] px-6 py-3 md:px-8"
      >
        <div className="mx-auto max-w-5xl font-[var(--font-manrope)] text-xs text-[#64748B]">
          <Link href="/encyclopedia" className="hover:text-[#0D9488]">
            Encyclopedia
          </Link>
          <span className="mx-2 text-[#CBD5E1]">/</span>
          <Link href="/encyclopedia/clusters" className="hover:text-[#0D9488]">
            Clusters
          </Link>
          <span className="mx-2 text-[#CBD5E1]">/</span>
          <span className="text-[#334155]">{rollup.title}</span>
        </div>
      </nav>
      <PublicEncyclopediaClusterHub rollup={rollup} />
    </>
  );
}
