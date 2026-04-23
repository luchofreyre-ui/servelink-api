import { useEffect, useMemo, useState } from "react";
import type { ApiError } from "../../../app/api/adminApiClient";
import type { FoSupplyDetail, FoWeeklyScheduleSlot } from "../api/types";
import {
  deriveFoOnboardingSectionRows,
  reasonCodesToSectionHintLine,
} from "../lib/foSupplyOnboardingSectionSignals";
import { usePatchFoSupplyDetail, usePutFoWeeklySchedule } from "../hooks/useSupply";
import { FoSupplyActivationAlert } from "./FoSupplyActivationAlert";
import { FoSupplyActivationStep } from "./FoSupplyActivationStep";
import { FoSupplyReadinessPanel } from "./FoSupplyReadinessPanel";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const STATUS_OPTIONS = [
  "onboarding",
  "active",
  "paused",
  "suspended",
  "safety_hold",
  "offboarded",
] as const;

type ScheduleRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

function signalBadge(signal: "complete" | "incomplete" | "invalid") {
  const base = "rounded-full px-2 py-0.5 text-xs font-medium";
  if (signal === "complete") return `${base} bg-emerald-100 text-emerald-900`;
  if (signal === "invalid") return `${base} bg-red-100 text-red-900`;
  return `${base} bg-amber-100 text-amber-900`;
}

function signalLabel(signal: "complete" | "incomplete" | "invalid") {
  if (signal === "complete") return "OK";
  if (signal === "invalid") return "Invalid";
  return "Incomplete";
}

export function FoSupplyConfigWorkflow({
  foId,
  detail,
  onRefresh,
}: {
  foId: string;
  detail: FoSupplyDetail;
  onRefresh: () => void;
}) {
  const readiness = detail.readiness;
  const patch = usePatchFoSupplyDetail(foId);
  const putSchedule = usePutFoWeeklySchedule(foId);

  const [requestError, setRequestError] = useState<ApiError | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<string>("onboarding");
  const [safetyHold, setSafetyHold] = useState(false);
  const [homeLat, setHomeLat] = useState("");
  const [homeLng, setHomeLng] = useState("");
  const [maxTravelMinutes, setMaxTravelMinutes] = useState("");
  const [maxDailyLaborMinutes, setMaxDailyLaborMinutes] = useState("");
  const [maxLaborMinutes, setMaxLaborMinutes] = useState("");
  const [maxSquareFootage, setMaxSquareFootage] = useState("");
  const [matchableTypesRaw, setMatchableTypesRaw] = useState("");
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>(() =>
    [0, 1, 2, 3, 4, 5, 6].map((d) => ({
      dayOfWeek: d,
      startTime: "",
      endTime: "",
    })),
  );

  useEffect(() => {
    if (!readiness) return;
    const c = readiness.configSummary;
    setDisplayName(readiness.displayName ?? "");
    setStatus(readiness.status);
    setSafetyHold(readiness.safetyHold);
    setHomeLat(c.homeLat != null ? String(c.homeLat) : "");
    setHomeLng(c.homeLng != null ? String(c.homeLng) : "");
    setMaxTravelMinutes(
      c.maxTravelMinutes != null ? String(c.maxTravelMinutes) : "",
    );
    setMaxDailyLaborMinutes(
      c.maxDailyLaborMinutes != null ? String(c.maxDailyLaborMinutes) : "",
    );
    setMaxLaborMinutes(c.maxLaborMinutes != null ? String(c.maxLaborMinutes) : "");
    setMaxSquareFootage(
      c.maxSquareFootage != null ? String(c.maxSquareFootage) : "",
    );
    setMatchableTypesRaw(c.matchableServiceTypes.join(", "));

    const byDay = new Map<number, FoWeeklyScheduleSlot>();
    for (const s of detail.schedules ?? []) {
      byDay.set(s.dayOfWeek, s);
    }
    setScheduleRows(
      [0, 1, 2, 3, 4, 5, 6].map((d) => {
        const hit = byDay.get(d);
        return {
          dayOfWeek: d,
          startTime: hit?.startTime ?? "",
          endTime: hit?.endTime ?? "",
        };
      }),
    );
    setRequestError(null);
  }, [detail, readiness]);

  const mergedCodes = useMemo(() => {
    if (detail.mergedReasonCodes?.length) return detail.mergedReasonCodes;
    if (!readiness) return [];
    return Array.from(
      new Set([...readiness.supply.reasons, ...readiness.eligibility.reasons]),
    );
  }, [detail.mergedReasonCodes, readiness]);

  const sectionRows = useMemo(() => {
    if (!readiness) return [];
    return deriveFoOnboardingSectionRows(readiness, detail.queueState);
  }, [readiness, detail.queueState]);

  const attentionLine = useMemo(
    () => reasonCodesToSectionHintLine(mergedCodes),
    [mergedCodes],
  );

  if (!readiness) {
    return null;
  }

  const numOrNull = (raw: string): number | null => {
    const t = raw.trim();
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  const handleSaveProfileBasics = async () => {
    setRequestError(null);
    try {
      await patch.mutateAsync({
        displayName: displayName.trim() || null,
        status,
        safetyHold,
      });
      onRefresh();
    } catch (e) {
      setRequestError(e as ApiError);
    }
  };

  const handleSaveServiceArea = async () => {
    setRequestError(null);
    try {
      await patch.mutateAsync({
        homeLat: numOrNull(homeLat),
        homeLng: numOrNull(homeLng),
        maxTravelMinutes: numOrNull(maxTravelMinutes),
      });
      onRefresh();
    } catch (e) {
      setRequestError(e as ApiError);
    }
  };

  const handleSaveServiceTypes = async () => {
    setRequestError(null);
    try {
      const types = matchableTypesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await patch.mutateAsync({
        matchableServiceTypes: types,
      });
      onRefresh();
    } catch (e) {
      setRequestError(e as ApiError);
    }
  };

  const handleSaveCapacity = async () => {
    setRequestError(null);
    try {
      await patch.mutateAsync({
        maxDailyLaborMinutes: numOrNull(maxDailyLaborMinutes),
        maxLaborMinutes: numOrNull(maxLaborMinutes),
        maxSquareFootage: numOrNull(maxSquareFootage),
      });
      onRefresh();
    } catch (e) {
      setRequestError(e as ApiError);
    }
  };

  const handleSaveSchedule = async () => {
    setRequestError(null);
    const schedule: FoWeeklyScheduleSlot[] = scheduleRows
      .filter((r) => r.startTime.trim() && r.endTime.trim())
      .map((r) => ({
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime.trim(),
        endTime: r.endTime.trim(),
      }));
    try {
      await putSchedule.mutateAsync(schedule);
      onRefresh();
    } catch (e) {
      setRequestError(e as ApiError);
    }
  };

  const btn =
    "inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="space-y-6" data-testid="fo-supply-config-workflow">
      <nav
        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"
        aria-label="Onboarding steps"
      >
        <p className="mb-2 font-semibold text-slate-900">Guided setup order</p>
        <ol className="flex flex-wrap gap-2">
          {sectionRows.map((row) => (
            <li key={row.id}>
              <a
                href={`#fo-onboard-${row.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-800 hover:bg-slate-100"
              >
                <span>{row.label}</span>
                <span className={signalBadge(row.signal)}>{signalLabel(row.signal)}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <FoSupplyReadinessPanel readiness={readiness} attentionLine={attentionLine} />

      {requestError ? <FoSupplyActivationAlert error={requestError} /> : null}

      <section id="fo-onboard-profile" className="rounded-2xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">1 · Basic profile</h2>
        <p className="mb-3 text-xs text-slate-600">
          Display name and safety flags. Keep status on <strong>onboarding</strong> or{" "}
          <strong>paused</strong> until supply checks pass; use step 6 to activate.
        </p>
        <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">Display name</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Status</span>
            <select
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={safetyHold}
              onChange={(e) => setSafetyHold(e.target.checked)}
            />
            Safety hold
          </label>
        </div>
        <div className="mt-4">
          <button
            type="button"
            className={btn}
            disabled={patch.isPending}
            onClick={() => void handleSaveProfileBasics()}
          >
            {patch.isPending ? "Saving…" : "Save profile"}
          </button>
        </div>
      </section>

      <section id="fo-onboard-serviceArea" className="rounded-2xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">2 · Service area & travel</h2>
        <p className="mb-3 text-xs text-slate-600">
          Home base coordinates and maximum travel time (minutes).
        </p>
        <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">Home latitude</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={homeLat}
              onChange={(e) => setHomeLat(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Home longitude</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={homeLng}
              onChange={(e) => setHomeLng(e.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Max travel (minutes)</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={maxTravelMinutes}
              onChange={(e) => setMaxTravelMinutes(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-4">
          <button
            type="button"
            className={btn}
            disabled={patch.isPending}
            onClick={() => void handleSaveServiceArea()}
          >
            {patch.isPending ? "Saving…" : "Save service area & travel"}
          </button>
        </div>
      </section>

      <section id="fo-onboard-serviceTypes" className="rounded-2xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">3 · Service types</h2>
        <p className="mb-3 text-xs text-slate-600">
          Comma-separated <code className="text-xs">service_type</code> values. Empty means
          all types (server default).
        </p>
        <label className="block max-w-2xl text-sm">
          <span className="text-slate-600">Matchable service types</span>
          <input
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            value={matchableTypesRaw}
            onChange={(e) => setMatchableTypesRaw(e.target.value)}
            placeholder="maintenance, move_in"
          />
        </label>
        <div className="mt-4">
          <button
            type="button"
            className={btn}
            disabled={patch.isPending}
            onClick={() => void handleSaveServiceTypes()}
          >
            {patch.isPending ? "Saving…" : "Save service types"}
          </button>
        </div>
      </section>

      <section id="fo-onboard-capacity" className="rounded-2xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">4 · Capacity</h2>
        <p className="mb-3 text-xs text-slate-600">
          Labor and home-size limits used for matching. Values must be positive when set.
        </p>
        <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">Max daily labor (minutes)</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={maxDailyLaborMinutes}
              onChange={(e) => setMaxDailyLaborMinutes(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Max labor / job (minutes)</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={maxLaborMinutes}
              onChange={(e) => setMaxLaborMinutes(e.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Max square footage</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={maxSquareFootage}
              onChange={(e) => setMaxSquareFootage(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-4">
          <button
            type="button"
            className={btn}
            disabled={patch.isPending}
            onClick={() => void handleSaveCapacity()}
          >
            {patch.isPending ? "Saving…" : "Save capacity"}
          </button>
        </div>
      </section>

      <section id="fo-onboard-schedule" className="rounded-2xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">5 · Weekly schedule</h2>
        <p className="mb-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded p-2">
          Active franchise owners cannot be left with zero schedule rows. To clear or
          rebuild hours, set status to <strong>paused</strong> in step 1, save, then edit
          schedule, then activate again in step 6.
        </p>
        <div className="space-y-2">
          {scheduleRows.map((row, idx) => (
            <div
              key={row.dayOfWeek}
              className="flex flex-wrap items-center gap-2 border-b border-slate-100 py-2 text-sm"
            >
              <span className="w-28 font-medium text-slate-700">
                {DAY_LABELS[row.dayOfWeek]}
              </span>
              <input
                className="w-28 rounded border px-2 py-1 text-xs"
                placeholder="08:00"
                value={row.startTime}
                onChange={(e) => {
                  const next = [...scheduleRows];
                  next[idx] = { ...row, startTime: e.target.value };
                  setScheduleRows(next);
                }}
              />
              <span className="text-slate-400">–</span>
              <input
                className="w-28 rounded border px-2 py-1 text-xs"
                placeholder="18:00"
                value={row.endTime}
                onChange={(e) => {
                  const next = [...scheduleRows];
                  next[idx] = { ...row, endTime: e.target.value };
                  setScheduleRows(next);
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button
            type="button"
            className={btn}
            disabled={putSchedule.isPending}
            onClick={() => void handleSaveSchedule()}
          >
            {putSchedule.isPending ? "Saving schedule…" : "Save weekly schedule"}
          </button>
        </div>
      </section>

      <FoSupplyActivationStep
        foId={foId}
        queueState={detail.queueState}
        mergedReasonCodes={mergedCodes}
        currentStatus={readiness.status}
        onRefresh={onRefresh}
      />
    </div>
  );
}
