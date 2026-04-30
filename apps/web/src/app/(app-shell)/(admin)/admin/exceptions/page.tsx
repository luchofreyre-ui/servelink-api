"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DispatchExceptionActionValidationBadge } from "@/components/admin/dispatch-exceptions/DispatchExceptionActionValidationBadge";
import { fetchDispatchExceptionActions } from "@/lib/api/dispatchExceptionActions";
import { getStoredAccessToken } from "@/lib/auth";
import type {
  DispatchExceptionActionListItem,
  DispatchExceptionActionPriority,
  DispatchExceptionActionStatus,
  DispatchExceptionValidationState,
} from "@/types/dispatchExceptionActions";

const ACTIVE_STATUSES: DispatchExceptionActionStatus[] = [
  "open",
  "investigating",
  "waiting",
];

const ALL_STATUSES: DispatchExceptionActionStatus[] = [
  "open",
  "investigating",
  "waiting",
  "resolved",
  "dismissed",
];

const ALL_PRIORITIES: DispatchExceptionActionPriority[] = [
  "critical",
  "high",
  "medium",
  "low",
];

const ALL_VALIDATION: DispatchExceptionValidationState[] = [
  "pending",
  "passed",
  "failed",
];

const SLA_STATUSES = [
  "on_track",
  "due_soon",
  "overdue",
  "paused",
  "completed",
] as const;

function statusPill(status: string) {
  return (
    <span className="inline-flex rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
      {status}
    </span>
  );
}

function priorityPill(priority: string) {
  const hot = priority === "critical" || priority === "high";
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        hot ?
          "border-amber-400/35 bg-amber-500/15 text-amber-100"
        : "border-white/15 bg-white/[0.06] text-white/65"
      }`}
    >
      {priority}
    </span>
  );
}

function slaStatusBadge(sla: string | null | undefined) {
  if (!sla) {
    return <span className="text-xs text-white/40">—</span>;
  }
  const done = sla === "completed";
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        sla === "overdue" ?
          "border-rose-400/40 bg-rose-500/15 text-rose-100"
        : sla === "due_soon" ?
          "border-orange-400/35 bg-orange-500/15 text-orange-100"
        : done ?
          "border-white/15 bg-white/[0.06] text-white/55"
        : "border-white/15 bg-white/[0.06] text-white/65"
      }`}
    >
      {sla.replace(/_/g, " ")}
    </span>
  );
}

export default function DispatchExceptionActionsPage() {
  const searchParams = useSearchParams();
  const initRef = useRef(false);

  const [token, setToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [validationStates, setValidationStates] = useState<string[]>([]);
  const [slaStatuses, setSlaStatuses] = useState<string[]>([]);
  const [needsValidationOnly, setNeedsValidationOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [escalationReadyOnly, setEscalationReadyOnly] = useState(false);

  const [items, setItems] = useState<DispatchExceptionActionListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(getStoredAccessToken());
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (initRef.current || !searchParams) return;
    initRef.current = true;
    const preset = searchParams.get("preset");
    const nv = searchParams.get("needsValidation");
    if (nv === "1") setNeedsValidationOnly(true);
    if (preset === "unassigned-critical") {
      setPriorities(["critical"]);
      setStatuses([...ACTIVE_STATUSES]);
      setUnassignedOnly(true);
    } else if (preset === "active") {
      setStatuses([...ACTIVE_STATUSES]);
    } else if (preset === "resolved") {
      setStatuses(["resolved"]);
    } else if (preset === "sla-overdue") {
      setStatuses([...ACTIVE_STATUSES]);
      setSlaStatuses(["overdue"]);
    } else if (preset === "sla-due-soon") {
      setStatuses([...ACTIVE_STATUSES]);
      setSlaStatuses(["due_soon"]);
    } else if (preset === "escalation-ready") {
      setStatuses([...ACTIVE_STATUSES]);
      setEscalationReadyOnly(true);
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDispatchExceptionActions(token, {
        search: debouncedSearch.trim() || undefined,
        status: statuses.length ? statuses : undefined,
        priority: priorities.length ? priorities : undefined,
        validationState:
          validationStates.length ?
            (validationStates as DispatchExceptionValidationState[])
          : undefined,
        needsValidation: needsValidationOnly || undefined,
        slaStatus: slaStatuses.length ? [...slaStatuses] : undefined,
        escalationReady: escalationReadyOnly || undefined,
        unassignedOnly: unassignedOnly || undefined,
        limit: 400,
      });
      setItems(res.items);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load exception actions.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    debouncedSearch,
    statuses,
    priorities,
    validationStates,
    slaStatuses,
    needsValidationOnly,
    unassignedOnly,
    escalationReadyOnly,
  ]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    void load();
  }, [token, load]);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Dispatch exception actions</h1>
            <p className="mt-1 text-sm text-white/55">
              Owned work items keyed by stable exception identity. Syncs when{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                GET /api/v1/admin/dispatch/exceptions
              </code>{" "}
              runs.{" "}
              <Link href="/admin" className="text-sky-300 hover:text-sky-200">
                ← Admin home
              </Link>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white">Filters</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <label className="block text-xs text-white/45">
              Search
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, summary, key, booking…"
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-teal-400/50 focus:outline-none"
              />
            </label>
            <div>
              <p className="text-xs text-white/45">Status (multi-select)</p>
              <select
                multiple
                value={statuses}
                onChange={(e) =>
                  setStatuses(
                    Array.from(e.target.selectedOptions, (o) => o.value),
                  )
                }
                className="mt-1 min-h-[7rem] w-full rounded-lg border border-white/15 bg-black/30 px-2 py-2 text-sm text-white"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-white/45">Priority (multi-select)</p>
              <select
                multiple
                value={priorities}
                onChange={(e) =>
                  setPriorities(
                    Array.from(e.target.selectedOptions, (o) => o.value),
                  )
                }
                className="mt-1 min-h-[7rem] w-full rounded-lg border border-white/15 bg-black/30 px-2 py-2 text-sm text-white"
              >
                {ALL_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-white/45">Validation state (multi-select)</p>
              <select
                multiple
                value={validationStates}
                onChange={(e) =>
                  setValidationStates(
                    Array.from(e.target.selectedOptions, (o) => o.value),
                  )
                }
                className="mt-1 min-h-[7rem] w-full rounded-lg border border-white/15 bg-black/30 px-2 py-2 text-sm text-white"
              >
                {ALL_VALIDATION.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-white/45">SLA status (multi-select)</p>
              <select
                multiple
                value={slaStatuses}
                onChange={(e) =>
                  setSlaStatuses(
                    Array.from(e.target.selectedOptions, (o) => o.value),
                  )
                }
                className="mt-1 min-h-[7rem] w-full rounded-lg border border-white/15 bg-black/30 px-2 py-2 text-sm text-white"
              >
                {SLA_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-3 text-sm text-white/75">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={needsValidationOnly}
                  onChange={(e) => setNeedsValidationOnly(e.target.checked)}
                  className="rounded border-white/30 bg-black/40"
                />
                Needs validation only
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={unassignedOnly}
                  onChange={(e) => setUnassignedOnly(e.target.checked)}
                  className="rounded border-white/30 bg-black/40"
                />
                Unassigned only
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={escalationReadyOnly}
                  onChange={(e) => setEscalationReadyOnly(e.target.checked)}
                  className="rounded border-white/30 bg-black/40"
                />
                Escalation ready only
              </label>
              <p className="text-xs text-white/40">
                Empty multi-selects mean no filter on that axis.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-teal-400/40 bg-teal-500/20 px-4 py-2 text-xs font-medium text-teal-100 hover:bg-teal-500/30"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setStatuses([]);
                setPriorities([]);
                setValidationStates([]);
                setSlaStatuses([]);
                setNeedsValidationOnly(false);
                setUnassignedOnly(false);
                setEscalationReadyOnly(false);
              }}
              className="rounded-lg border border-white/20 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/80 hover:bg-white/10"
            >
              Clear filters
            </button>
          </div>
        </div>

        {loading ? <p className="text-sm text-white/55">Loading…</p> : null}
        {error ? <p className="text-sm text-amber-200/90">{error}</p> : null}

        {!loading && !error ?
          items.length === 0 ?
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-white/50">
              No exception actions match these filters. Open the dispatch
              exceptions feed once to bootstrap rows from active exceptions.
            </div>
          : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Exception</th>
                    <th className="px-4 py-3 font-semibold">Priority</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Owner</th>
                    <th className="px-4 py-3 font-semibold">Booking / FO</th>
                    <th className="px-4 py-3 font-semibold">SLA</th>
                    <th className="px-4 py-3 font-semibold">Due at</th>
                    <th className="px-4 py-3 font-semibold">Escalation</th>
                    <th className="px-4 py-3 font-semibold">Validation</th>
                    <th className="px-4 py-3 font-semibold">Notes</th>
                    <th className="px-4 py-3 font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {items.map((row) => (
                    <tr key={row.dispatchExceptionKey} className="hover:bg-white/[0.03]">
                      <td className="max-w-xs px-4 py-3 align-top">
                        <Link
                          href={`/admin/exceptions/actions/${encodeURIComponent(row.dispatchExceptionKey)}`}
                          className="block text-white hover:text-teal-200"
                        >
                          <span className="font-medium">
                            {row.exceptionTitle ||
                              row.exceptionSummary ||
                              "Untitled"}
                          </span>
                          {row.exceptionSummary && row.exceptionTitle ?
                            <span className="mt-1 block line-clamp-2 text-xs text-white/45">
                              {row.exceptionSummary}
                            </span>
                          : null}
                          <span className="mt-1 block font-mono text-[10px] text-white/35">
                            {row.dispatchExceptionKey}
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">
                        {priorityPill(row.priority)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">
                        {statusPill(row.status)}
                      </td>
                      <td className="max-w-[8rem] px-4 py-3 align-top text-xs text-white/70">
                        {row.ownerName || row.ownerUserId || "—"}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-white/70">
                        <Link
                          href={`/admin/bookings/${encodeURIComponent(row.bookingId)}`}
                          className="font-mono text-sky-300 underline-offset-2 hover:underline"
                        >
                          {row.bookingId}
                        </Link>
                        {row.foId ?
                          <div className="mt-0.5 font-mono text-white/50">
                            FO {row.foId}
                          </div>
                        : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">
                        {slaStatusBadge(row.slaStatus)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-white/65">
                        {row.slaDueAt ?
                          new Date(row.slaDueAt).toLocaleString()
                        : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top text-xs">
                        {row.escalationReadyAt ?
                          <span className="rounded-md border border-violet-400/30 bg-violet-500/15 px-2 py-0.5 font-medium text-violet-100">
                            Ready
                          </span>
                        : (
                          <span className="text-white/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <DispatchExceptionActionValidationBadge
                          status={row.status}
                          validationState={row.validationState}
                          compact
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-white/70">
                        {row.noteCount ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-white/55">
                        {new Date(row.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        : null}
      </div>
    </main>
  );
}
