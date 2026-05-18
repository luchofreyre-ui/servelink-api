import { GlobalSearchForm } from "@/components/search/GlobalSearchForm";

export function ServiceHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E8DFD0]/80 bg-[#FFFCF7]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
        {/* LEFT — BRAND */}
        <a
          href="/"
          aria-label="Nu Standard home"
          className="shrink-0 font-[var(--font-poppins)] text-sm font-semibold tracking-tight text-[#0F172A] transition hover:text-[#0F172A]"
        >
          Nu Standard
        </a>

        {/* CENTER — NAV */}
        <nav className="hidden items-center gap-5 font-[var(--font-manrope)] text-[13px] text-[#64748B] md:flex">
          <a href="/" className="transition hover:text-[#0F172A]">
            Home
          </a>
          <a href="/services" className="transition hover:text-[#0F172A]">
            Services
          </a>
          <a href="/book" className="transition hover:text-[#0F172A]">
            Book
          </a>
          <a href="/guides" className="transition hover:text-[#0F172A]">
            Guides
          </a>
          <a href="/problems" className="transition hover:text-[#0F172A]">
            Problems
          </a>
        </nav>

        {/* RIGHT — SEARCH + CTA */}
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <div className="hidden w-48 shrink-0 lg:block">
            <GlobalSearchForm
              placeholder="Search guides…"
              className="w-full gap-2 [&_button]:border-[#E8DFD0]/90 [&_button]:bg-white/80 [&_button]:px-3 [&_button]:py-1.5 [&_button]:text-[11px] [&_input]:rounded-xl [&_input]:border-[#E8DFD0]/90 [&_input]:bg-white/80 [&_input]:px-3 [&_input]:py-1.5 [&_input]:text-[11px]"
            />
          </div>
          <a
            href="/book"
            className="rounded-full border border-[#E8DFD0]/90 bg-white/80 px-3.5 py-2 font-[var(--font-manrope)] text-xs font-semibold text-[#0F172A] shadow-[0_10px_26px_-24px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:bg-[#FFF9F3] active:translate-y-px sm:border-transparent sm:bg-[#0F172A] sm:px-4 sm:text-white sm:shadow-[0_12px_30px_-22px_rgba(15,23,42,0.5)] sm:hover:bg-[#162131]"
          >
            Book Now
          </a>
        </div>
      </div>
    </header>
  );
}
