import { GlobalSearchForm } from "@/components/search/GlobalSearchForm";

export function PublicSiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        {/* LEFT — BRAND */}
        <div className="text-sm font-semibold tracking-tight text-zinc-900">Nu Standard</div>

        {/* CENTER — NAV */}
        <nav className="hidden items-center gap-6 text-sm text-zinc-600 md:flex">
          <a href="/problems" className="transition hover:text-zinc-900">
            Problems
          </a>
          <a href="/surfaces" className="transition hover:text-zinc-900">
            Surfaces
          </a>
          <a href="/products" className="transition hover:text-zinc-900">
            Products
          </a>
          <a href="/guides" className="transition hover:text-zinc-900">
            Guides
          </a>
          <a
            href="/encyclopedia"
            data-testid="public-nav-encyclopedia"
            className="transition hover:text-zinc-900"
          >
            Encyclopedia
          </a>
        </nav>

        {/* RIGHT — SEARCH + CTA */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden w-52 shrink-0 md:block lg:w-64">
            <GlobalSearchForm
              placeholder="Search surfaces, methods, guides…"
              className="w-full gap-2 [&_button]:px-3 [&_button]:py-2 [&_button]:text-xs [&_input]:px-3 [&_input]:py-2 [&_input]:text-xs"
            />
          </div>
          <a
            href="/products"
            className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
          >
            View Products
          </a>
        </div>
      </div>
    </header>
  );
}
