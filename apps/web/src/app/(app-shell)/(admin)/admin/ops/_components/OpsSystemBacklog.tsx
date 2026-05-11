import Link from "next/link";
import { ReactNode } from "react";
import type {
  FoSupplyReadinessResponse,
  OpsItemsResponse,
  OpsSummaryResponse,
} from "@/lib/api/adminOps";
import { DeferredDispatchTable } from "./DeferredDispatchTable";
import { DispatchLockedTable } from "./DispatchLockedTable";
import { EstimateGovernanceListChips } from "./EstimateGovernanceListChips";
import { FoSupplyReadinessSection } from "./FoSupplyReadinessSection";
import { RecurringPlanOutcomesSection } from "./RecurringPlanOutcomesSection";
import { RecurringPlansSection } from "./RecurringPlansSection";
import { ReviewRequiredTable } from "./ReviewRequiredTable";

export type OpsSystemBacklogProps = {
  summary: OpsSummaryResponse;
  invalid: OpsItemsResponse;
  locked: OpsItemsResponse;
  reviewRequired: OpsItemsResponse;
  deferred: OpsItemsResponse;
  manual: OpsItemsResponse;
  foSupply: FoSupplyReadinessResponse;
};

export default function OpsSystemBacklog(props: OpsSystemBacklogProps) {
  const { summary, invalid, locked, reviewRequired, deferred, manual, foSupply } =
    props;
  const s = summary?.summary;
  const payment = s?.payment ?? summary?.payment;
  const cronLedger = s?.cronLedger ?? summary?.cronLedger;

  return (
    <div
      id="ops-backlog"
      className="scroll-mt-24 border-t border-gray-200 bg-gray-50 p-6 text-gray-900 space-y-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Dispatch backlog & system metrics</h2>
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

      <OpsStatusSummary payment={payment} cronLedger={cronLedger} />
      <PaymentHealthSection payment={payment} />
      <CronLedgerHealthSection cronLedger={cronLedger} />
      <LearningCompletionHealthSection />

      <Section
        id="recurring-plans"
        title="Recurring Plans"
        actions={
          <ActionLink href="/admin/ops#recurring-plans">
            Refresh section
          </ActionLink>
        }
      >
        <RecurringPlansSection />
      </Section>

      <Section
        id="recurring-plan-outcomes"
        title="Recurring Plan Outcomes"
        actions={
          <ActionLink href="/admin/ops#recurring-plan-outcomes">
            Refresh section
          </ActionLink>
        }
      >
        <RecurringPlanOutcomesSection />
      </Section>

      <Section
        id="fo-supply-readiness"
        title="FO supply readiness (internal)"
        actions={
          <ActionLink href="/admin/ops#fo-supply-readiness">
            Refresh section
          </ActionLink>
        }
      >
        <p className="border-b bg-gray-100 px-3 py-2 text-xs text-gray-600">
          Customer matching uses the same supply primitives as this table. Paused
          or ineligible FOs are excluded before team selection; reason codes match
          server evaluation.
        </p>
        <FoSupplyReadinessSection items={foSupply.items ?? []} />
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

function OpsStatusSummary({
  payment,
  cronLedger,
}: {
  payment: NonNullable<OpsSummaryResponse["summary"]["payment"]> | undefined;
  cronLedger: NonNullable<OpsSummaryResponse["summary"]["cronLedger"]> | undefined;
}) {
  const paymentAttention = Boolean(
    payment?.flags?.hasDepositStateMismatch ||
      payment?.flags?.hasRecentPaymentFailures ||
      payment?.flags?.hasStalePendingPayments,
  );
  const cronJobs = Object.values(cronLedger?.jobs ?? {});
  const cronStatus =
    cronLedger?.available === false
      ? "Not available"
      : cronJobs.length === 0
        ? "No Runs Yet"
        : cronJobs.some((job) => (job.recentFailures24h ?? 0) > 0)
          ? "Attention Required"
          : "Healthy";
  const learningVisible = "Visible";
  const opsAttention = paymentAttention || cronStatus === "Attention Required";

  return (
    <Section title="System Status Summary">
      <div className="grid gap-3 bg-white p-3 md:grid-cols-4">
        <StatusPill
          label="Payment"
          value={payment ? (paymentAttention ? "Attention Required" : "Healthy") : "Not available"}
          warning={paymentAttention}
          unavailable={!payment}
        />
        <StatusPill
          label="Cron"
          value={cronStatus}
          warning={cronStatus === "Attention Required"}
          unavailable={cronStatus === "Not available" || cronStatus === "No Runs Yet"}
        />
        <StatusPill label="Learning" value={learningVisible} />
        <StatusPill
          label="Ops"
          value={opsAttention ? "Attention Required" : "Healthy"}
          warning={opsAttention}
        />
      </div>
    </Section>
  );
}

function StatusPill({
  label,
  value,
  warning = false,
  unavailable = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
  unavailable?: boolean;
}) {
  const className = unavailable
    ? "border-gray-200 bg-gray-50 text-gray-600"
    : warning
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return (
    <div className={`rounded border p-3 ${className}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function PaymentHealthSection({
  payment,
}: {
  payment: NonNullable<OpsSummaryResponse["summary"]["payment"]> | undefined;
}) {
  if (!payment) {
    return (
      <Section title="Payment Health">
        <EmptyState label="Payment health is not available in ops summary." />
      </Section>
    );
  }

  const bookingStates = payment.bookingStates ?? {};
  const anomalies = payment.anomalies ?? {};
  const staleBuckets = payment.staleBuckets ?? {};
  const flags = payment.flags ?? {};
  const totalPaymentAnomalies =
    Number(anomalies.openPaymentAnomalies ?? 0) +
    Number(anomalies.openOpsPaymentAnomalies ?? 0);

  return (
    <Section title="Payment Health">
      <div className="space-y-4 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          <MiniMetric label="Pending payment" value={bookingStates.pendingPayment} />
          <MiniMetric label="Authorized" value={bookingStates.authorized} />
          <MiniMetric label="Deposit succeeded" value={bookingStates.depositSucceeded} />
          <MiniMetric
            label="Completed missing alignment"
            value={bookingStates.completedMissingPaymentAlignment}
          />
          <MiniMetric
            label="Deposit state mismatch"
            value={bookingStates.depositStateMismatch}
            warning={Boolean(bookingStates.depositStateMismatch)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border bg-gray-50 p-3">
            <h4 className="font-medium">Anomalies</h4>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <KeyValue label="Total payment anomalies" value={totalPaymentAnomalies} />
              <KeyValue
                label="Recent last 24h"
                value={anomalies.recentPaymentAnomaliesLast24h}
              />
            </dl>
          </div>
          <div className="rounded border bg-gray-50 p-3">
            <h4 className="font-medium">Flags</h4>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <FlagChip
                label="Recent payment failures"
                active={flags.hasRecentPaymentFailures}
              />
              <FlagChip
                label="Stale pending payments"
                active={flags.hasStalePendingPayments}
              />
              <FlagChip
                label="Deposit state mismatch"
                active={flags.hasDepositStateMismatch}
              />
            </div>
          </div>
        </div>

        <div className="rounded border bg-gray-50 p-3">
          <h4 className="font-medium">Stale pending buckets</h4>
          <div className="mt-2 grid gap-2 text-sm md:grid-cols-3 xl:grid-cols-6">
            {["0-30m", "30m-2h", "2h-24h", "1-7d", "7-30d", ">30d"].map(
              (bucket) => (
                <KeyValue
                  key={bucket}
                  label={bucket}
                  value={staleBuckets[bucket as keyof typeof staleBuckets]}
                />
              ),
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

function CronLedgerHealthSection({
  cronLedger,
}: {
  cronLedger: NonNullable<OpsSummaryResponse["summary"]["cronLedger"]> | undefined;
}) {
  const jobs = Object.entries(cronLedger?.jobs ?? {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <Section title="Cron Ledger Health">
      {cronLedger?.available === false ? (
        <EmptyState
          label={`Cron ledger is not available${cronLedger.reason ? `: ${cronLedger.reason}` : "."}`}
        />
      ) : jobs.length === 0 ? (
        <EmptyState label="No cron ledger runs have been recorded yet." />
      ) : (
        <div className="overflow-x-auto bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-3 py-2">Job</th>
                <th className="px-3 py-2">Last status</th>
                <th className="px-3 py-2">Last started</th>
                <th className="px-3 py-2">Last finished</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Runs 24h</th>
                <th className="px-3 py-2">Failures 24h</th>
                <th className="px-3 py-2">Last error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map(([jobName, job]) => (
                <tr key={jobName}>
                  <td className="px-3 py-2 font-mono text-xs">{jobName}</td>
                  <td className="px-3 py-2">{job.lastStatus ?? "Not available"}</td>
                  <td className="px-3 py-2">{formatOpsDate(job.lastStartedAt)}</td>
                  <td className="px-3 py-2">{formatOpsDate(job.lastFinishedAt)}</td>
                  <td className="px-3 py-2">{formatDuration(job.lastDurationMs)}</td>
                  <td className="px-3 py-2">{job.recentRuns24h ?? "Not available"}</td>
                  <td className="px-3 py-2">{job.recentFailures24h ?? "Not available"}</td>
                  <td className="px-3 py-2">{job.lastErrorMessage ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

function LearningCompletionHealthSection() {
  return (
    <Section title="Learning / Completion Health">
      <div className="space-y-2 bg-white p-4 text-sm text-gray-700">
        <p>
          Learning and controlled completion visibility is available from the
          existing estimate-learning ops endpoint.
        </p>
        <p className="text-gray-500">
          This ops summary payload does not currently include learning counts, so
          no health label is inferred here.
        </p>
      </div>
    </Section>
  );
}

function MiniMetric({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number | undefined;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded border p-3 ${warning ? "border-amber-200 bg-amber-50" : "bg-gray-50"}`}
    >
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">
        {value ?? "Not available"}
      </div>
    </div>
  );
}

function KeyValue({
  label,
  value,
}: {
  label: string;
  value: number | string | boolean | null | undefined;
}) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium">{value ?? "Not available"}</dd>
    </div>
  );
}

function FlagChip({
  label,
  active,
}: {
  label: string;
  active: boolean | undefined;
}) {
  return (
    <span
      className={`rounded px-2 py-1 ${active ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}
    >
      {label}: {active ? "Attention Required" : "Healthy"}
    </span>
  );
}

function formatOpsDate(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatDuration(value: number | null | undefined) {
  if (typeof value !== "number") return "Not available";
  return `${value}ms`;
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
        <h3 className="font-semibold">{title}</h3>
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
                <div className="flex flex-col gap-1">
                  <Link href={`/admin/bookings/${id}`} className="underline">
                    {id}
                  </Link>
                  <EstimateGovernanceListChips
                    bookingId={id}
                    governanceSummary={row.governanceSummary}
                    recurringEconomicsSummary={row.recurringEconomicsSummary}
                  />
                </div>
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
                <div className="flex flex-col gap-1">
                  <Link href={`/admin/bookings/${bookingId}`} className="underline">
                    {bookingId}
                  </Link>
                  <EstimateGovernanceListChips
                    bookingId={bookingId}
                    governanceSummary={row.governanceSummary}
                    recurringEconomicsSummary={row.recurringEconomicsSummary}
                  />
                </div>
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
