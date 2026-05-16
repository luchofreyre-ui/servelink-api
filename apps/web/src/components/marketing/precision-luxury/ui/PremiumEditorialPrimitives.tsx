import Link from "next/link";
import type { ReactNode } from "react";

/** Shared motion curve for chips, cards, and buttons */
export const editorialInteractiveTransition =
  "transition-[transform,box-shadow,border-color,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export function EditorialPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A] antialiased selection:bg-[#C9B27C]/25">
      {children}
    </div>
  );
}

export type EditorialCrumb = { label: string; href?: string };

export function EditorialBreadcrumb({ items }: { items: EditorialCrumb[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="font-[var(--font-manrope)] text-xs text-[#64748B]">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {isLast || !item.href ? (
                <span className={isLast ? "font-medium text-[#0F172A]" : undefined}>{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className={`group inline-flex items-center gap-0.5 hover:text-[#0F172A] ${editorialInteractiveTransition}`}
                >
                  <span className="border-b border-transparent pb-px group-hover:border-[#C9B27C]/70">
                    {item.label}
                  </span>
                  <span
                    aria-hidden
                    className="translate-x-0 text-[10px] opacity-60 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function EditorialHero({
  eyebrow,
  title,
  body,
  align = "split",
  aside,
}: {
  eyebrow: string;
  title: string;
  body: string;
  align?: "split" | "stack";
  aside?: ReactNode;
}) {
  return (
    <section
      className={
        align === "split"
          ? "grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14"
          : "space-y-8"
      }
    >
      <div className="min-w-0 space-y-5">
        <p className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.26em] text-[#B89F6B]">
          {eyebrow}
        </p>
        <h1 className="font-[var(--font-poppins)] text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-[#0F172A] sm:text-4xl lg:text-[2.65rem]">
          {title}
        </h1>
        <p className="max-w-xl font-[var(--font-manrope)] text-base leading-relaxed text-[#475569] sm:text-lg">
          {body}
        </p>
      </div>
      {aside ? <div className="min-w-0">{aside}</div> : null}
    </section>
  );
}

export function EditorialMediaFrame({
  src,
  alt,
  aspectClassName = "aspect-[4/3]",
  priority,
  frameClassName,
}: {
  src?: string | null;
  alt: string;
  aspectClassName?: string;
  priority?: boolean;
  /** Override outer frame rounding/shadow for nested editorial cards */
  frameClassName?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border border-[#E5D9C8]/90 bg-[#F4EDE3] shadow-[0_18px_46px_-28px_rgba(15,23,42,0.35)] ${aspectClassName} ${frameClassName ?? ""}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- editorial stills from local public assets
        <img
          src={src}
          alt={alt}
          className={`h-full w-full object-cover ${editorialInteractiveTransition} motion-safe:duration-500 hover:scale-[1.015]`}
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <div className="flex h-full min-h-[200px] flex-col justify-end bg-gradient-to-br from-[#FBF6EE] via-[#F3EBDD] to-[#E8DDD0] p-6">
          <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
            Nu Standard Editorial
          </p>
          <p className="mt-2 font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B]">
            Calm, instructional imagery placeholder — swap when a dedicated asset is assigned.
          </p>
        </div>
      )}
    </div>
  );
}

export function EditorialCard({
  href,
  eyebrow,
  title,
  summary,
  ctaLabel = "Read guide",
  media,
  clickable = true,
}: {
  href: string;
  eyebrow?: string;
  title: string;
  summary: string;
  ctaLabel?: string;
  media?: ReactNode;
  clickable?: boolean;
}) {
  const inner = (
    <>
      {media ? (
        <div className="relative -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-[18px] border-b border-[#E8DFD0]/80">
          {media}
        </div>
      ) : null}
      {eyebrow ? (
        <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="mt-2 font-[var(--font-poppins)] text-lg font-semibold leading-snug tracking-tight text-[#0F172A]">
        {title}
      </h3>
      <p className="mt-3 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569]">{summary}</p>
      <span
        className={`mt-5 inline-flex items-center gap-1.5 font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488] ${editorialInteractiveTransition} group-hover:gap-2`}
      >
        {ctaLabel}
        <span aria-hidden className="text-xs">
          →
        </span>
      </span>
    </>
  );

  const cardBase =
    "group flex h-full flex-col rounded-[18px] border border-[#E8DFD0]/95 bg-white/90 p-6 shadow-[0_14px_38px_-26px_rgba(15,23,42,0.28)] outline-none focus-visible:ring-2 focus-visible:ring-[#C9B27C]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF9F3]";

  if (!clickable) {
    return <div className={cardBase}>{inner}</div>;
  }

  return (
    <Link
      href={href}
      className={`${cardBase} ${editorialInteractiveTransition} hover:-translate-y-0.5 hover:border-[#C9B27C]/35 hover:shadow-[0_22px_50px_-28px_rgba(15,23,42,0.35)] active:translate-y-px`}
    >
      {inner}
    </Link>
  );
}

export function EditorialCardGrid({
  children,
  className = "grid gap-6 sm:grid-cols-2 xl:grid-cols-4",
}: {
  children: ReactNode;
  /** Tailwind grid classes; default fits four featured editorial cards on wide screens. */
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export type EditorialTrustItem = { title: string; body?: string };

export function EditorialTrustStrip({
  items,
  variant = "dense",
}: {
  items: EditorialTrustItem[];
  variant?: "dense" | "mini";
}) {
  return (
    <div
      className={`rounded-[18px] border border-[#E8DFD0]/90 bg-[#FFFCF7]/90 ${variant === "mini" ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}
    >
      <div
        className={`grid gap-6 ${variant === "mini" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}
      >
        {items.map((item) => (
          <div key={item.title} className="min-w-0">
            <p className="font-[var(--font-poppins)] text-xs font-semibold uppercase tracking-[0.16em] text-[#B89F6B]">
              {item.title}
            </p>
            {item.body ? (
              <p className="mt-2 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569]">{item.body}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MockupPageShell({ children }: { children: ReactNode }) {
  return <EditorialPageShell>{children}</EditorialPageShell>;
}

export function MockupHero({
  eyebrow,
  title,
  body,
  aside,
}: {
  eyebrow: string;
  title: string;
  body: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="grid overflow-hidden rounded-[34px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-5 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.38)] sm:p-7 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:items-stretch lg:gap-7 lg:p-9">
      <div className="flex min-w-0 flex-col justify-center rounded-[28px] border border-[#E8DFD0]/80 bg-white/76 p-6 sm:p-8">
        <p className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B89F6B]">
          {eyebrow}
        </p>
        <h1 className="mt-5 font-[var(--font-poppins)] text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.055em] text-[#0F172A] sm:text-5xl lg:text-[3.05rem]">
          {title}
        </h1>
        <div className="mt-5 max-w-2xl font-[var(--font-manrope)] text-base leading-7 text-[#475569] sm:text-lg sm:leading-8">
          {body}
        </div>
      </div>
      {aside ? <div className="min-w-0">{aside}</div> : null}
    </section>
  );
}

export function MockupMediaFrame(props: Parameters<typeof EditorialMediaFrame>[0]) {
  return (
    <EditorialMediaFrame
      {...props}
      frameClassName={`rounded-[30px] ${props.frameClassName ?? ""}`}
    />
  );
}

export function MockupCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border border-[#E8DFD0]/95 bg-white/90 p-6 shadow-[0_16px_44px_-32px_rgba(15,23,42,0.3)] ${className}`}
    >
      {children}
    </div>
  );
}

export function MockupFeatureCard({
  href,
  eyebrow,
  title,
  body,
  cta = "Explore",
  className = "",
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex min-h-full flex-col justify-between rounded-[30px] border border-[#C9B27C]/24 bg-white p-6 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)] outline-none ${editorialInteractiveTransition} hover:-translate-y-0.5 hover:border-[#C9B27C]/45 focus-visible:ring-2 focus-visible:ring-[#C9B27C]/45 ${className}`}
    >
      <div>
        <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B89F6B]">
          {eyebrow}
        </p>
        <h3 className="mt-4 font-[var(--font-poppins)] text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#0F172A]">
          {title}
        </h3>
        <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
          {body}
        </p>
      </div>
      <span className="mt-6 inline-flex items-center gap-1.5 font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488] group-hover:gap-2">
        {cta} <span aria-hidden>→</span>
      </span>
    </Link>
  );
}

export function MockupTrustStrip({ items }: { items: EditorialTrustItem[] }) {
  return <EditorialTrustStrip items={items} variant="dense" />;
}
