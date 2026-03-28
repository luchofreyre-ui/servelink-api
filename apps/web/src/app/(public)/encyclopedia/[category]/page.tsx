import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import {
  getAllEncyclopediaCategories,
  getPublishedEncyclopediaEntriesByCategory,
} from "@/lib/encyclopedia/loader";
import {
  buildEncyclopediaCategoryHref,
  formatEncyclopediaCategoryLabel,
} from "@/lib/encyclopedia/slug";
import { encyclopediaCategorySchema } from "@/lib/encyclopedia/schema";

interface EncyclopediaCategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateStaticParams() {
  return getAllEncyclopediaCategories().map((category) => ({
    category,
  }));
}

export async function generateMetadata({
  params,
}: EncyclopediaCategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const parsedCategory = encyclopediaCategorySchema.safeParse(
    resolvedParams.category,
  );

  if (!parsedCategory.success) {
    return {
      title: "Cleaning Encyclopedia",
    };
  }

  const label = formatEncyclopediaCategoryLabel(parsedCategory.data);

  return {
    title: `${label} | Cleaning Encyclopedia`,
    description: `Published articles in the ${label.toLowerCase()} section of the cleaning encyclopedia.`,
  };
}

export default async function EncyclopediaCategoryPage({
  params,
}: EncyclopediaCategoryPageProps) {
  const resolvedParams = await params;
  const parsedCategory = encyclopediaCategorySchema.safeParse(
    resolvedParams.category,
  );

  if (!parsedCategory.success) {
    notFound();
  }

  const category = parsedCategory.data;
  const entries = getPublishedEncyclopediaEntriesByCategory(category);
  const label = formatEncyclopediaCategoryLabel(category);

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-16 md:px-8">
        <nav className="font-[var(--font-manrope)] text-xs text-[#64748B]">
          <Link href="/encyclopedia" className="hover:text-[#0D9488]">
            Encyclopedia
          </Link>
          {" / "}
          <span className="text-[#0F172A]">{label}</span>
        </nav>

        <h1 className="mt-6 font-[var(--font-poppins)] text-4xl font-semibold tracking-tight">
          {label}
        </h1>

        <p className="mt-4 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
          Published file-backed articles in the {label.toLowerCase()} category.
        </p>

        {entries.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-[#C9B27C]/20 bg-white/80 p-6 font-[var(--font-manrope)] text-sm text-[#64748B]">
            This category exists and is ready for content, but no published
            file-backed articles are live yet.
          </div>
        ) : (
          <ul className="mt-10 space-y-3 font-[var(--font-manrope)] text-sm">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={entry.href}
                  className="font-medium text-[#0D9488] hover:underline"
                >
                  {entry.title}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <section className="mt-14 border-t border-[#C9B27C]/20 pt-10">
          <Link
            href={buildEncyclopediaCategoryHref("problems")}
            className="mr-4 font-[var(--font-manrope)] text-sm font-medium text-[#0D9488] hover:underline"
          >
            Problems
          </Link>
          <Link
            href={buildEncyclopediaCategoryHref("methods")}
            className="mr-4 font-[var(--font-manrope)] text-sm font-medium text-[#0D9488] hover:underline"
          >
            Methods
          </Link>
          <Link
            href={buildEncyclopediaCategoryHref("surfaces")}
            className="mr-4 font-[var(--font-manrope)] text-sm font-medium text-[#0D9488] hover:underline"
          >
            Surfaces
          </Link>
          <Link
            href={buildEncyclopediaCategoryHref("chemicals")}
            className="font-[var(--font-manrope)] text-sm font-medium text-[#0D9488] hover:underline"
          >
            Chemicals
          </Link>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
