import Link from "next/link";

const CARDS = [
  {
    href: "/admin/authority",
    title: "Overview",
    description:
      "Hub for encyclopedia authority tools: review queue, cluster density, and batch pipeline runs.",
    testId: "admin-authority-hub-card-overview",
  },
  {
    href: "/admin/authority/review-queue",
    title: "Review queue",
    description:
      "Review and manually promote or reject expanded/standard encyclopedia candidates.",
    testId: "admin-authority-hub-card-review-queue",
  },
  {
    href: "/admin/authority/cluster-density",
    title: "Cluster density",
    description: "Inspect thin, developing, and dense encyclopedia clusters.",
    testId: "admin-authority-hub-card-cluster-density",
  },
  {
    href: "/admin/authority/batches",
    title: "Batch runs",
    description:
      "View pipeline summaries, append yield, generated counts, and build status.",
    testId: "admin-authority-hub-card-batches",
  },
] as const;

export default function AdminAuthorityHubPage() {
  return (
    <main
      className="min-h-screen bg-neutral-950 px-6 py-10 text-white"
      data-testid="admin-authority-hub-page"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Admin · Authority · Encyclopedia
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Authority</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65">
            Operate the encyclopedia corpus: triage generated candidates, inspect cluster health, and
            read batch pipeline outcomes.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {CARDS.map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                data-testid={card.testId}
                className="block h-full rounded-2xl border border-white/10 bg-black/25 p-5 transition hover:border-emerald-500/35 hover:bg-black/40"
              >
                <h2 className="text-base font-semibold text-emerald-100/95">{card.title}</h2>
                <p className="mt-2 text-sm text-white/55">{card.description}</p>
                <p className="mt-3 text-xs font-medium text-emerald-400/80">Open →</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
