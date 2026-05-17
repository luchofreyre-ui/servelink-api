import { publicFooterColumns } from "../content/publicNavigationData";

export function PublicSiteFooter() {
  return (
    <footer className="border-t border-[#C9B27C]/16 bg-white/60">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
              Nu Standard Cleaning
            </p>
            <h2 className="mt-4 font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.03em] text-[#0F172A]">
              Calm, prepared home care from the first question to the final walkthrough.
            </h2>
            <p className="mt-4 max-w-xl font-[var(--font-manrope)] text-base leading-8 text-[#475569]">
              Nu Standard pairs owner-led accountability with clear coordination, respectful arrivals, and
              service guidance that helps every visit feel organized before the team reaches your door.
            </p>
          </div>

          {publicFooterColumns.map((column) => (
            <div key={column.title}>
              <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.22em] text-[#C9B27C]">
                {column.title}
              </p>
              <div className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block font-[var(--font-manrope)] text-sm text-[#475569] transition hover:text-[#0F172A]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
