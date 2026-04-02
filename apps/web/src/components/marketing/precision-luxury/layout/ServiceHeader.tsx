export function ServiceHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* LEFT — BRAND */}
        <div className="text-base font-semibold text-zinc-900">
          Nu Standard
        </div>

        {/* CENTER — NAV */}
        <nav className="hidden items-center gap-8 text-sm text-zinc-600 md:flex">
          <a href="/" className="hover:text-zinc-900 transition">
            Home
          </a>
          <a href="/services" className="hover:text-zinc-900 transition">
            Services
          </a>
          <a href="/book" className="hover:text-zinc-900 transition">
            Book
          </a>
          <a href="/guides" className="hover:text-zinc-900 transition">
            Guides
          </a>
        </nav>

        {/* RIGHT — CTA */}
        <a
          href="/book"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition"
        >
          Book Now
        </a>
      </div>
    </header>
  );
}
