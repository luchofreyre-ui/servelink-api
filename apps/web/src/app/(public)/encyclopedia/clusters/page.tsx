import type { Metadata } from "next";
import Link from "next/link";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import { getEncyclopediaClusterIndexRollups } from "@/lib/encyclopedia/loader";

export const metadata: Metadata = {
  title: "Topic clusters — Cleaning encyclopedia",
  description:
    "Pipeline-backed topic clusters grouping problems, methods, and surfaces from the unified encyclopedia index.",
};

export default function EncyclopediaClustersIndexPage() {
  const rollups = getEncyclopediaClusterIndexRollups();

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16 md:px-8">
        <div className="space-y-3">
          <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
            <Link href="/encyclopedia" className="hover:text-[#0D9488]">
              Encyclopedia
            </Link>
            <span className="mx-2 text-[#CBD5E1]">/</span>
            Topic clusters
          </p>
          <h1 className="font-[var(--font-poppins)] text-4xl font-semibold tracking-tight text-[#0F172A]">
            Topic clusters
          </h1>
          <p className="max-w-2xl font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
            Each hub is built from published encyclopedia entries only—problems
            first, then methods and surfaces—so search and readers follow a
            clear authority path.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {rollups.map((r) => (
            <li key={r.cluster}>
              <Link
                href={`/encyclopedia/clusters/${r.cluster}`}
                className="block rounded-3xl border border-[#C9B27C]/20 bg-white/80 p-6 shadow-sm transition hover:border-[#C9B27C]/35"
              >
                <h2 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
                  {r.title}
                </h2>
                <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#64748B]">
                  {r.totalPublishedPages} guides
                  {r.problemCount ? ` · ${r.problemCount} problems` : ""}
                  {r.methodCount ? ` · ${r.methodCount} methods` : ""}
                  {r.surfaceCount ? ` · ${r.surfaceCount} surfaces` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
