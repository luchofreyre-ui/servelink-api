import Link from "next/link";
import {
  pickAntiPatternCrossLinks,
  pickEntryClusterCrossLinks,
} from "@/authority/data/authorityTopicalCrossLinks";

type Props = {
  /** Stable per-page string so links stay consistent across renders. */
  pageKey: string;
  /** When set (e.g. problem hub or surface+problem playbook), biases entry-cluster picks. */
  problemSlug?: string | null;
};

export function AuthorityTopicalCrossLinks(props: Props) {
  const { pageKey, problemSlug } = props;
  const entry = pickEntryClusterCrossLinks(pageKey, problemSlug);
  const anti = pickAntiPatternCrossLinks(pageKey);
  if (!entry.length && !anti.length) return null;

  return (
    <aside
      className="mb-10 rounded-xl border border-[#C9B27C]/30 bg-white/90 px-4 py-4"
      aria-label="Related guides"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">Also explore</p>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        {entry.length ? (
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">Room & category guides</p>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm">
              {entry.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-medium text-[#0D9488] hover:underline">
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {anti.length ? (
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">Why cleaning fails</p>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm">
              {anti.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-medium text-[#0D9488] hover:underline">
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
