"use client";

import { useMemo, useState } from "react";

import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilterSidebar } from "@/components/products/ProductFilterSidebar";
import { ProductSearchBar } from "@/components/products/ProductSearchBar";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import {
  EditorialBreadcrumb,
  EditorialMediaFrame,
  EditorialPageShell,
  EditorialTrustStrip,
  editorialInteractiveTransition,
} from "@/components/marketing/precision-luxury/ui/PremiumEditorialPrimitives";
import { getAllPublishedProducts } from "@/lib/products/productPublishing";

const ALL_PRODUCTS = getAllPublishedProducts();

const TOP_RATED = [...ALL_PRODUCTS].sort((a, b) => b.rating.finalScore - a.rating.finalScore).slice(0, 3);

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export default function ProductsIndexPage() {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [chemicalClass, setChemicalClass] = useState("");
  const [problem, setProblem] = useState("");
  const [surface, setSurface] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "brand" | "category">("score");

  const filterMeta = useMemo(() => {
    return {
      brands: uniqueSorted(ALL_PRODUCTS.map((p) => p.brand)),
      categories: uniqueSorted(ALL_PRODUCTS.map((p) => p.category)),
      chemicalClasses: uniqueSorted(ALL_PRODUCTS.map((p) => p.chemicalClass)),
      problems: uniqueSorted(ALL_PRODUCTS.flatMap((p) => p.compatibleProblems)),
      surfaces: uniqueSorted(ALL_PRODUCTS.flatMap((p) => p.compatibleSurfaces)),
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = ALL_PRODUCTS.filter((product) => {
      const matchesQuery =
        q === "" ||
        [
          product.title,
          product.brand,
          product.category,
          product.chemicalClass,
          ...product.compatibleProblems,
          ...product.compatibleSurfaces,
          ...product.bestUseCases,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesBrand = brand === "" || product.brand === brand;
      const matchesCategory = category === "" || product.category === category;
      const matchesChemicalClass = chemicalClass === "" || product.chemicalClass === chemicalClass;
      const matchesProblem = problem === "" || product.compatibleProblems.includes(problem);
      const matchesSurface = surface === "" || product.compatibleSurfaces.includes(surface);

      return (
        matchesQuery &&
        matchesBrand &&
        matchesCategory &&
        matchesChemicalClass &&
        matchesProblem &&
        matchesSurface
      );
    });

    result.sort((a, b) => {
      if (sortBy === "score") return b.rating.finalScore - a.rating.finalScore;
      if (sortBy === "brand") return a.brand.localeCompare(b.brand);
      return a.category.localeCompare(b.category);
    });

    return result;
  }, [query, brand, category, chemicalClass, problem, surface, sortBy]);

  function clearAllFilters() {
    setQuery("");
    setBrand("");
    setCategory("");
    setChemicalClass("");
    setProblem("");
    setSurface("");
  }

  return (
    <EditorialPageShell>
      <PublicSiteHeader />
      <main className="pb-16">
        <section className="mx-auto max-w-7xl px-6 pt-8 md:px-8 md:pt-12">
          <EditorialBreadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Encyclopedia", href: "/encyclopedia" },
              { label: "Products" },
            ]}
          />

          <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
            <div className="flex min-w-0 flex-col justify-between rounded-[34px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-6 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.38)] sm:p-8 lg:p-10">
              <div>
                <p className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B89F6B]">
                  PRODUCTS
                </p>
                <h1 className="mt-5 font-[var(--font-poppins)] text-[2.35rem] font-semibold leading-[1.03] tracking-[-0.055em] text-[#0F172A] sm:text-5xl lg:text-[3.1rem]">
                  Label first. Surface second. Convenience third.
                </h1>
                <p className="mt-5 max-w-xl font-[var(--font-manrope)] text-base leading-7 text-[#475569] sm:text-lg sm:leading-8">
                  Product guidance built around surface compatibility, label respect, and safer routines.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  ["Label-first", "Always defer to manufacturer instructions."],
                  ["Surface-aware", "Compatibility beats popularity scores."],
                  ["Patch-test", "Sensitive finishes deserve a slower decision."],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-[20px] border border-[#E8DFD0]/85 bg-white/78 p-4">
                    <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B89F6B]">
                      {title}
                    </p>
                    <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5">
              <div className="relative">
                <EditorialMediaFrame
                  src="/media/trust/oop-quality-inspection.jpg"
                  alt="Nu Standard technician inspecting finishes during detailed residential cleaning."
                  aspectClassName="aspect-[16/10]"
                  frameClassName="rounded-[30px]"
                />
                <div className="mt-5 rounded-[24px] border border-[#C9B27C]/20 bg-white/92 p-5 shadow-[0_22px_62px_-46px_rgba(15,23,42,0.46)] lg:absolute lg:bottom-5 lg:left-5 lg:right-5 lg:mt-0">
                  <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                    Compatibility panel
                  </p>
                  <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                    Use the catalog to narrow options, then verify the label and the surface before applying anything.
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#E8DFD0]/95 bg-white/85 p-5">
                <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                  Product search
                </p>
                <div className="mt-4">
                  <ProductSearchBar value={query} onChange={setQuery} />
                </div>
                <p className="mt-3 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                  Search by product, brand, chemistry, problem, or surface. Filters below refine compatibility context.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-4 px-6 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full">
            <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
              Active compatibility context
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  brand && { key: "brand", label: brand },
                  category && { key: "category", label: category },
                  chemicalClass && { key: "chemicalClass", label: chemicalClass },
                  problem && { key: "problem", label: problem },
                  surface && { key: "surface", label: surface },
                ] as const
              )
                .filter((c): c is { key: string; label: string } => Boolean(c))
                .map((c) => (
                  <span
                    key={c.key}
                    className="rounded-full border border-[#C9B27C]/25 bg-[#F5EFD9] px-3 py-1 text-xs text-neutral-800"
                  >
                    {c.label}
                  </span>
                ))}
              {!brand && !category && !chemicalClass && !problem && !surface ? (
                <span className="rounded-full border border-[#E8DFD0]/95 bg-white/85 px-3 py-1 text-xs text-[#64748B]">
                  No filters selected
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="sort-by" className="text-sm text-neutral-600">
              Sort
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "score" | "brand" | "category")}
              className={`rounded-xl border border-[#E8DFD0]/95 bg-white px-3 py-2 text-sm text-[#0F172A] outline-none focus-visible:ring-2 focus-visible:ring-[#C9B27C]/35 ${editorialInteractiveTransition}`}
            >
              <option value="score">Final score</option>
              <option value="brand">Brand</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-8 px-6 pb-4 md:px-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <ProductFilterSidebar
            groups={[
              {
                title: "Brand",
                keyName: "brand",
                options: filterMeta.brands.map((value) => ({ label: value, value })),
                selected: brand,
                onSelect: setBrand,
              },
              {
                title: "Category",
                keyName: "category",
                options: filterMeta.categories.map((value) => ({ label: value, value })),
                selected: category,
                onSelect: setCategory,
              },
              {
                title: "Chemical class",
                keyName: "chemicalClass",
                options: filterMeta.chemicalClasses.map((value) => ({ label: value, value })),
                selected: chemicalClass,
                onSelect: setChemicalClass,
              },
              {
                title: "Problem",
                keyName: "problem",
                options: filterMeta.problems.map((value) => ({ label: value, value })),
                selected: problem,
                onSelect: setProblem,
              },
              {
                title: "Surface",
                keyName: "surface",
                options: filterMeta.surfaces.map((value) => ({ label: value, value })),
                selected: surface,
                onSelect: setSurface,
              },
            ]}
          />

          <section>
            <div className="mb-5 flex items-center justify-between">
              <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
                {filtered.length} product{filtered.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="mb-8 rounded-[28px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/90 p-5 sm:p-6">
              <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                Reference highlights
              </p>
              <p className="mt-2 max-w-2xl font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569]">
                Higher compatibility scores can narrow choices—still verify labels and patch-test sensitive finishes.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:grid-cols-3">
                {TOP_RATED.map((product) => (
                  <ProductCard key={`top-${product.slug}`} product={product} />
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10">
                <h2 className="text-lg font-semibold text-neutral-900">Nothing matches yet</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Try a shorter search, clear one filter at a time, or reset everything. The catalog is small on
                  purpose—tight filters can easily hide every product.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-5 rounded-xl border border-[#C9B27C] bg-[#F5EFD9] px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-[#EDE4CC]"
                >
                  Clear search and filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:gap-6">
                {filtered.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <PublicSiteFooter />
    </EditorialPageShell>
  );
}
