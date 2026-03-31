import Link from "next/link";
import type { StructuredSection } from "@/lib/encyclopedia/structuredTypes";

function proseParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const sectionShell =
  "mt-8 rounded-2xl border border-[#C9B27C]/15 bg-white/60 p-6 shadow-sm first:mt-0";

/** URL fragment / SEO anchor; title-based with stable fallback from section id. */
function sectionHeadingAnchorId(section: StructuredSection): string {
  const fromTitle = section.title
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return fromTitle || section.id.replace(/_/g, "-");
}

type Props = {
  section: StructuredSection;
  resolveInternalLink?: (slug: string) => string;
};

export function SectionRenderer({ section, resolveInternalLink }: Props) {
  const headingId = sectionHeadingAnchorId(section);

  if (section.kind === "meta_grid") {
    return (
      <section className={sectionShell} aria-labelledby={headingId}>
        <h2
          id={headingId}
          className="font-[var(--font-poppins)] text-xl font-semibold tracking-tight text-[#0F172A]"
        >
          {section.title}
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {section.rows.map((row) => (
            <div
              key={`${section.id}-${row.label}`}
              className="rounded-xl border border-[#C9B27C]/10 bg-white/80 px-4 py-3"
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                {row.label}
              </dt>
              <dd className="mt-1 font-[var(--font-manrope)] text-sm leading-relaxed text-[#334155]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }

  if (section.kind === "link_list") {
    return (
      <section className={sectionShell} aria-labelledby={headingId}>
        <h2
          id={headingId}
          className="font-[var(--font-poppins)] text-xl font-semibold tracking-tight text-[#0F172A]"
        >
          {section.title}
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {section.slugs.map((slug) => {
            const href = resolveInternalLink?.(slug) ?? `/encyclopedia/problems/${slug}`;
            return (
              <li key={`${section.id}-${slug}`}>
                <Link
                  href={href}
                  className="block rounded-xl border border-[#C9B27C]/15 bg-white px-4 py-3 font-[var(--font-manrope)] text-sm font-medium text-[#334155] transition hover:border-[#C9B27C]/30 hover:text-[#0F172A]"
                >
                  {slug.replace(/-/g, " ")}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  if (section.kind === "decision_box") {
    return (
      <section className={sectionShell} aria-labelledby={headingId}>
        <h2
          id={headingId}
          className="font-[var(--font-poppins)] text-xl font-semibold tracking-tight text-[#0F172A]"
        >
          {section.title}
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#C9B27C]/15 bg-white/80 p-4">
            <h3 className="font-[var(--font-poppins)] font-semibold text-[#0F172A]">YES</h3>
            <ul className="mt-2 list-disc pl-5 font-[var(--font-manrope)] text-sm leading-relaxed text-[#334155]">
              {section.yes.map((item, index) => (
                <li key={`${section.id}-yes-${index}`}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#C9B27C]/15 bg-white/80 p-4">
            <h3 className="font-[var(--font-poppins)] font-semibold text-[#0F172A]">NO</h3>
            <ul className="mt-2 list-disc pl-5 font-[var(--font-manrope)] text-sm leading-relaxed text-[#334155]">
              {section.no.map((item, index) => (
                <li key={`${section.id}-no-${index}`}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#C9B27C]/15 bg-white/80 p-4">
            <h3 className="font-[var(--font-poppins)] font-semibold text-[#0F172A]">PARTIAL</h3>
            <ul className="mt-2 list-disc pl-5 font-[var(--font-manrope)] text-sm leading-relaxed text-[#334155]">
              {section.partial.map((item, index) => (
                <li key={`${section.id}-partial-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  if (section.kind === "tool_list" || section.kind === "product_list") {
    return (
      <section className={sectionShell} aria-labelledby={headingId}>
        <h2
          id={headingId}
          className="font-[var(--font-poppins)] text-xl font-semibold tracking-tight text-[#0F172A]"
        >
          {section.title}
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 font-[var(--font-manrope)] text-base leading-8 text-[#334155]">
          {section.items.map((item, index) => (
            <li key={`${section.id}-item-${index}`}>{item}</li>
          ))}
        </ul>
      </section>
    );
  }

  if (section.kind === "diagnostic_grid") {
    return (
      <section className={sectionShell} aria-labelledby={headingId}>
        <h2
          id={headingId}
          className="font-[var(--font-poppins)] text-xl font-semibold tracking-tight text-[#0F172A]"
        >
          {section.title}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {section.items.map((item, index) => (
            <div
              key={`${section.id}-diag-${index}-${item.label}`}
              className="rounded-xl border border-[#C9B27C]/15 bg-white/80 p-4"
            >
              <h3 className="font-[var(--font-poppins)] font-semibold text-[#0F172A]">
                {item.label}
              </h3>
              <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#334155]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const paragraphs = proseParagraphs(section.body);

  return (
    <section className={sectionShell} aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="font-[var(--font-poppins)] text-xl font-semibold tracking-tight text-[#0F172A]"
      >
        {section.title}
      </h2>
      <div className="font-[var(--font-manrope)] mt-4 space-y-4 text-base leading-8 text-[#334155]">
        {paragraphs.map((p) => (
          <p key={`${section.id}-${p.slice(0, 48)}`} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
