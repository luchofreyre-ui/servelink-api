import type { ReactNode } from "react";
import clsx from "clsx";

export function AuthoritySection({
  title,
  children,
  id,
  className,
  density = "default",
}: {
  title: string;
  children: ReactNode;
  id?: string;
  className?: string;
  /** Tighter stack for problem hub and similar dense pages. */
  density?: "default" | "compact";
}) {
  const isCompact = density === "compact";
  return (
    <section
      id={id}
      className={clsx(isCompact ? "mb-6 scroll-mt-24" : "mb-10 scroll-mt-24", className)}
    >
      <h2
        className={clsx(
          "font-[var(--font-poppins)] font-semibold text-[#0F172A]",
          isCompact ? "mb-2 text-lg md:text-xl" : "mb-3 text-xl md:text-2xl",
        )}
      >
        {title}
      </h2>
      <div
        className={clsx(
          "font-[var(--font-manrope)] text-sm text-[#475569] md:text-base",
          isCompact ? "space-y-2 leading-[1.35]" : "space-y-4 leading-[1.4]",
        )}
      >
        {children}
      </div>
    </section>
  );
}
