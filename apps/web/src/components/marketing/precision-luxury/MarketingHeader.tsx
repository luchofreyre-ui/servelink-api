import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/book", label: "Book" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#C9B27C]/14 bg-[#FFF9F3]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-8">
        <Link
          href="/"
          className="font-[var(--font-poppins)] text-lg font-semibold tracking-[-0.02em] text-[#0F172A]"
        >
          Nu Standard
        </Link>

        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 font-[var(--font-manrope)] text-sm font-medium text-[#475569] transition hover:bg-white hover:text-[#0F172A]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/book"
          className="hidden shrink-0 rounded-full bg-[#0D9488] px-5 py-2.5 font-[var(--font-manrope)] text-sm font-semibold text-white shadow-[0_10px_28px_rgba(13,148,136,0.2)] transition hover:bg-[#0b7f76] sm:inline-flex"
        >
          Start Booking
        </Link>
      </div>
    </header>
  );
}
