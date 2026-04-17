import type { ReactNode } from "react";

type BookingOptionCardProps = {
  title: string;
  body: string;
  meta?: string;
  selected?: boolean;
  onClick?: () => void;
  children?: ReactNode;
};

export function BookingOptionCard({
  title,
  body,
  meta,
  selected = false,
  onClick,
  children,
}: BookingOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[24px] border p-6 text-left transition ${
        selected
          ? "border-[#0D9488] bg-white shadow-[0_18px_50px_rgba(13,148,136,0.12)]"
          : "border-[#C9B27C]/16 bg-white hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-[var(--font-poppins)] text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">
            {title}
          </h3>
          <p className="mt-3 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
            {body}
          </p>
          {meta ? (
            <p className="mt-4 font-[var(--font-manrope)] text-sm font-medium text-[#0D9488]">
              {meta}
            </p>
          ) : null}
        </div>

        <div
          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? "border-[#0D9488] bg-[#0D9488]"
              : "border-[#C9B27C]/25 bg-[#FFF9F3]"
          }`}
        >
          {selected ? <div className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
        </div>
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </button>
  );
}
