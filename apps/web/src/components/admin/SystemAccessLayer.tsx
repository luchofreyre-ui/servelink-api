import Link from "next/link";

type Destination = { label: string; href: string };

type SystemCard = {
  title: string;
  descriptor: string;
  destinations: Destination[];
  ctaLabel: string;
  ctaHref: string;
};

const SYSTEMS: SystemCard[] = [
  {
    title: "System Tests",
    descriptor: "Operational intelligence",
    destinations: [
      { label: "Runs", href: "/admin/system-tests" },
      { label: "Incidents", href: "/admin/system-tests/incidents" },
      { label: "Compare", href: "/admin/system-tests/compare" },
      { label: "Automation", href: "/admin/system-tests/automation" },
    ],
    ctaLabel: "Open system tests",
    ctaHref: "/admin/system-tests",
  },
  {
    title: "Authority",
    descriptor: "Decision intelligence",
    destinations: [
      { label: "Drift", href: "/admin/authority/drift" },
      { label: "Alerts", href: "/admin/authority/alerts" },
      { label: "Report", href: "/admin/authority/report" },
      { label: "Quality", href: "/admin/authority/quality" },
    ],
    ctaLabel: "Open authority",
    ctaHref: "/admin/authority",
  },
  {
    title: "Dispatch",
    descriptor: "Execution control",
    destinations: [
      { label: "Backlog", href: "/admin/ops#ops-backlog" },
      { label: "Exceptions", href: "/admin/exceptions" },
      { label: "Config", href: "/admin/dispatch-config" },
    ],
    ctaLabel: "Open dispatch systems",
    ctaHref: "/admin/ops#ops-backlog",
  },
  {
    title: "Knowledge",
    descriptor: "Content + ops pipeline",
    destinations: [
      { label: "Review", href: "/admin/knowledge-review" },
      { label: "Ops", href: "/admin/knowledge-ops" },
    ],
    ctaLabel: "Open knowledge systems",
    ctaHref: "/admin/knowledge-ops",
  },
];

function SystemCardItem(props: { card: SystemCard }) {
  const { card } = props;

  return (
    <article className="flex min-h-[220px] flex-col rounded-xl border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_28px_rgba(0,0,0,0.35)]">
      <header className="border-b border-white/10 pb-3">
        <h3 className="text-base font-semibold tracking-tight text-slate-50">
          {card.title}
        </h3>
        <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          {card.descriptor}
        </p>
      </header>

      <ul className="mt-3 flex flex-1 flex-col gap-2 text-sm">
        {card.destinations.map((d) => (
          <li key={`${card.title}-${d.href}`}>
            <Link
              href={d.href}
              className="group flex items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 text-slate-300 transition hover:border-white/10 hover:bg-white/[0.06] hover:text-slate-100"
            >
              <span className="font-medium text-slate-200">{d.label}</span>
              <span
                className="text-xs text-slate-500 group-hover:text-slate-400"
                aria-hidden
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-white/10 pt-4">
        <Link
          href={card.ctaHref}
          className="flex w-full items-center justify-center rounded-xl border border-white/18 bg-white/12 px-4 py-2.5 text-center text-sm font-semibold text-slate-100 shadow-[0_6px_22px_rgba(0,0,0,0.25)] transition hover:border-white/25 hover:bg-white/[0.18]"
        >
          {card.ctaLabel}
        </Link>
      </div>
    </article>
  );
}

export function SystemAccessLayer() {
  return (
    <section
      aria-labelledby="system-access-layer-heading"
      className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
    >
      <div className="mb-5 border-b border-white/10 pb-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Routing
        </p>
        <h2
          id="system-access-layer-heading"
          className="mt-1 text-lg font-semibold text-slate-50"
        >
          System Access Layer
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {SYSTEMS.map((card) => (
          <SystemCardItem key={card.title} card={card} />
        ))}
      </div>
    </section>
  );
}
