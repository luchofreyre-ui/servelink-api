import type { ReactNode } from "react";

type BookingStepFrameProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
};

export function BookingStepFrame({
  eyebrow,
  title,
  description,
  children,
  footer,
  aside,
}: BookingStepFrameProps) {
  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 space-y-3">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
              {eyebrow}
            </p>
          ) : null}

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950 md:text-[32px]">
              {title}
            </h2>

            {description ? (
              <p className="max-w-3xl text-sm leading-6 text-neutral-600 md:text-[15px]">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">{children}</div>

        {footer ? <div className="mt-8">{footer}</div> : null}
      </div>

      {aside ? (
        <aside className="h-fit rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
          {aside}
        </aside>
      ) : null}
    </section>
  );
}
