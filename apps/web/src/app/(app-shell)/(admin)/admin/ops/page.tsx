import Link from "next/link";
import { ReactNode } from "react";
import { loadAdminOpsPageData } from "@/lib/api/adminOps";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { DeferredDispatchTable } from "./_components/DeferredDispatchTable";
import { DispatchLockedTable } from "./_components/DispatchLockedTable";
import { ReviewRequiredTable } from "./_components/ReviewRequiredTable";

export default async function AdminOpsPage() {
  const { summary, invalid, locked, reviewRequired, deferred, manual } =
    await loadAdminOpsPageData(25);

  const s = summary?.summary;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">System Ops</h1>
          <p className="text-sm text-gray-500">
            Operational pressure, assignment integrity, and dispatch backlog.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionLink href="/admin/anomalies">Open anomalies</ActionLink>
          <ActionLink href="/admin/system-tests/incidents">
            Open system test incidents
          </ActionLink>
          <ActionLink href="/admin/exceptions">Open dispatch exceptions</ActionLink>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Invalid Assignment"
          value={s?.bookings?.invalidAssignmentState ?? 0}
          href="/admin/ops#invalid-assignment-state"
        />
        <MetricCard
          title="Dispatch Locked"
          value={s?.bookings?.dispatchLocked ?? 0}
          href="/admin/ops#dispatch-locked"
        />
        <MetricCard
          title="Review Required"
          value={s?.bookings?.reviewRequired ?? 0}
          href="/admin/ops#review-required"
        />
        <MetricCard
          title="Deferred Dispatch"
          value={s?.dispatch?.deferredDecisions ?? 0}
          href="/admin/ops#deferred-dispatch"
        />
      </div>

      <Section title="Hotspots">
        <div className="flex gap-2 flex-wrap">
          {(s?.hotspots ?? []).length ? (
            (s?.hotspots ?? []).map((h: string) => (
              <HotspotChip key={h} hotspot={h} />
            ))
          ) : (
            <div className="text-sm text-gray-500">No hotspots</div>
          )}
        </div>
      </Section>

      <Section
        id="invalid-assignment-state"
        title="Invalid Assignment State"
        actions={
          <ActionLink href="/admin/ops#invalid-assignment-state">
            Refresh section
          </ActionLink>
        }
      >
        <BookingTable
          items={invalid?.items ?? []}
          columns={["id", "status", "foId", "dispatchLockedAt", "updatedAt"]}
        />
      </Section>

      <Section
        id="dispatch-locked"
        title="Dispatch Locked Bookings"
        actions={
          <ActionLink href="/admin/exceptions">Dispatch exceptions</ActionLink>
        }
      >
        <DispatchLockedTable
          items={locked?.items ?? []}
          columns={["id", "status", "foId", "dispatchLockedAt", "updatedAt"]}
        />
      </Section>

      <Section
        id="review-required"
        title="Review Required Bookings"
        actions={
          <ActionLink href="/admin/ops#review-required">
            Refresh section
          </ActionLink>
        }
      >
        <ReviewRequiredTable items={reviewRequired?.items ?? []} />
      </Section>

      <Section
        id="deferred-dispatch"
        title="Deferred Dispatch Decisions"
        actions={
          <ActionLink href="/admin/exceptions">Open exceptions</ActionLink>
        }
      >
        <DeferredDispatchTable items={deferred?.items ?? []} />
      </Section>

      <Section
        id="manual-dispatch-actions"
        title="Manual Dispatch Actions (24h)"
        actions={
          <ActionLink href="/admin/ops#manual-dispatch-actions">
            Refresh section
          </ActionLink>
        }
      >
        <ManualDispatchTable items={manual?.items ?? []} />
      </Section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded border p-4 transition hover:bg-gray-50"
    >
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </Link>
  );
}

function Section({
  id,
  title,
  actions,
  children,
}: {
  id?: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-2 scroll-mt-24">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">{title}</h2>
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </div>
      <div className="overflow-hidden rounded border">{children}</div>
    </section>
  );
}

function ActionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
    >
      {children}
    </Link>
  );
}

function HotspotChip({ hotspot }: { hotspot: string }) {
  const href = hotspotHrefMap[hotspot] ?? "/admin/ops";

  return (
    <Link
      href={href}
      className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
    >
      {hotspot}
    </Link>
  );
}

const hotspotHrefMap: Record<string, string> = {
  invalid_assignment_state: "/admin/ops#invalid-assignment-state",
  dispatch_lock_pressure: "/admin/ops#dispatch-locked",
  review_queue_backlog: "/admin/ops#review-required",
  deferred_dispatch_backlog: "/admin/ops#deferred-dispatch",
  manual_dispatch_intervention: "/admin/ops#manual-dispatch-actions",
  ops_anomaly_backlog: "/admin/anomalies",
  system_test_incident_backlog: "/admin/system-tests/incidents",
};

function EmptyState({ label }: { label: string }) {
  return <div className="p-4 text-sm text-gray-500">{label}</div>;
}

function BookingTable({
  items,
  columns,
}: {
  items: Array<Record<string, unknown>>;
  columns: string[];
}) {
  if (!items.length) {
    return <EmptyState label="No records" />;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">booking</th>
          {columns
            .filter((c) => c !== "id")
            .map((c) => (
              <th key={c} className="p-2 text-left">
                {c}
              </th>
            ))}
          <th className="p-2 text-left">actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((row) => {
          const id = String(row.id ?? "");
          return (
            <tr key={id} className="border-b align-top">
              <td className="p-2 font-medium">
                <Link href={`/admin/bookings/${id}`} className="underline">
                  {id}
                </Link>
              </td>
              {columns
                .filter((c) => c !== "id")
                .map((c) => (
                  <td key={c} className="p-2">
                    {formatCell(row[c])}
                  </td>
                ))}
              <td className="p-2">
                <div className="flex flex-wrap gap-2">
                  <ActionLink href={`/admin/bookings/${id}`}>Open booking</ActionLink>
                  <ActionLink href="/admin/exceptions">Exceptions</ActionLink>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ManualDispatchTable({
  items,
}: {
  items: Array<Record<string, unknown>>;
}) {
  if (!items.length) {
    return <EmptyState label="No manual dispatch actions in the last 24 hours" />;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">booking</th>
          <th className="p-2 text-left">trigger</th>
          <th className="p-2 text-left">decisionStatus</th>
          <th className="p-2 text-left">createdAt</th>
          <th className="p-2 text-left">actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((row, index) => {
          const bookingId = String(row.bookingId ?? index);

          return (
            <tr key={`${bookingId}-${index}`} className="border-b align-top">
              <td className="p-2 font-medium">
                <Link href={`/admin/bookings/${bookingId}`} className="underline">
                  {bookingId}
                </Link>
              </td>
              <td className="p-2">{formatCell(row.trigger)}</td>
              <td className="p-2">{formatCell(row.decisionStatus)}</td>
              <td className="p-2">{formatCell(row.createdAt)}</td>
              <td className="p-2">
                <div className="flex flex-wrap gap-2">
                  <ActionLink href={`/admin/bookings/${bookingId}`}>Open booking</ActionLink>
                  <ActionLink href="/admin/exceptions">Exceptions</ActionLink>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function formatCell(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
