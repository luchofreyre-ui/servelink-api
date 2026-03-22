import Link from "next/link";
import type { IntentCta } from "../../conversion/intent/intentCtaTypes";

export function IntentCtaCard({ cta }: { cta: IntentCta }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
      <h2 className="text-lg font-semibold text-neutral-900">{cta.title}</h2>
      <p className="mt-2 text-sm text-neutral-600">{cta.description}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={cta.primaryHref}
          className="inline-flex rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          {cta.primaryLabel}
        </Link>
        {cta.secondaryHref && cta.secondaryLabel ? (
          <Link
            href={cta.secondaryHref}
            className="inline-flex rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800"
          >
            {cta.secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
