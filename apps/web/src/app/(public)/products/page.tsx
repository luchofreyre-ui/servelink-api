"use client";

import { useMemo, useState } from "react";

import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilterSidebar } from "@/components/products/ProductFilterSidebar";
import { ProductSearchBar } from "@/components/products/ProductSearchBar";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
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
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Product Library</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-900">
            Cleaning products, organized by real use case
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-700">
            Browse products by category, chemistry, surface, and cleaning problem.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-2xl">
            <ProductSearchBar value={query} onChange={setQuery} />
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
                    className="rounded-full bg-[#F5EFD9] px-3 py-1 text-xs text-neutral-800"
                  >
                    {c.label}
                  </span>
                ))}
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
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              <option value="score">Final score</option>
              <option value="brand">Brand</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
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
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-neutral-600">
                {filtered.length} product{filtered.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="mb-8">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Top rated</p>
              <p className="mt-1 text-sm text-neutral-600">
                Highest overall scores in the library—starting points when you are unsure what to grab first.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {filtered.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
