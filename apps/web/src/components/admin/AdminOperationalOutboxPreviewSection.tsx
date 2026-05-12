"use client";

import { useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { WEB_ENV } from "@/lib/env";

type DeliveryAttemptPreview = {
  id: string;
  channel: string;
  attemptNo: number;
  dryRun: boolean;
  success: boolean;
  createdAt: string;
  errorMessage: string | null;
  resultJson: unknown;
  providerKind: string | null;
  notificationCategory: string | null;
  templateKey: string | null;
  templateVersion: number | null;
};

type OperationalOutboxPreviewRow = {
  id: string;
  correlationId: string | null;
  eventType: string;
  lifecycleCategory: string | null;
  operationalEventCategory: string | null;
  processingState: string;
  attempts: number;
  createdAt: string;
  publishAfter: string | null;
  lastAttemptAt: string | null;
  processingStartedAt: string | null;
  payloadSchemaVersion: number;
  deliveredAt: string | null;
  dedupeKey: string | null;
  payloadJson: unknown;
  lastDeliveryResultJson: unknown;
  processingError: string | null;
  deliveryAttempts?: DeliveryAttemptPreview[];
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; items: OperationalOutboxPreviewRow[] };

function truncateJson(raw: unknown, max = 200): string {
  if (raw == null) return "—";
  const s =
    typeof raw === "string" ? raw.trim() : JSON.stringify(raw, null, 0);
  if (!s) return "—";
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

function formatIso(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

type Props = {
  bookingId: string;
};

/**
 * Read-only durable outbox rows + internal delivery attempts — no replay/retry controls.
 */
export function AdminOperationalOutboxPreviewSection({ bookingId }: Props) {
  const [state, setState] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    const token = getStoredAccessToken();
    if (!token) {
      setState({ status: "error", message: "Not signed in." });
      return () => {
        cancelled = true;
      };
    }

    setState({ status: "loading" });
    const url = `${WEB_ENV.apiBaseUrl}/admin/operational-outbox?bookingId=${encodeURIComponent(bookingId)}`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as {
          ok?: boolean;
          items?: OperationalOutboxPreviewRow[];
        } | null;
        if (cancelled) return;
        if (!res.ok || !body?.ok || !Array.isArray(body.items)) {
          setState({
            status: "error",
            message: !res.ok ? `HTTP ${res.status}` : "Unexpected response",
          });
          return;
        }
        setState({ status: "ok", items: body.items });
      })
      .catch((e) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: e instanceof Error ? e.message : "Request failed",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return (
    <section
      data-testid="admin-operational-outbox-preview"
      className="rounded-[28px] border border-white/10 bg-white/5 p-6"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Operational outbox (preview)</h2>
        <p className="mt-1 text-sm text-white/60">
          Mutation rows, pipeline results (internal + gated transactional email), and per-channel attempts — read-only.
          Batch simulate/process via{" "}
          <code className="rounded bg-black/50 px-1">POST /admin/operational-outbox/process-once</code>.
        </p>
      </div>

      {state.status === "loading" ? (
        <p className="text-sm text-white/55">Loading outbox…</p>
      ) : null}

      {state.status === "error" ? (
        <p className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {state.message}
        </p>
      ) : null}

      {state.status === "ok" && state.items.length === 0 ? (
        <p className="text-sm text-white/55">
          No outbox rows yet for this booking (mutations after rollout enqueue here).
        </p>
      ) : null}

      {state.status === "ok" && state.items.length > 0 ? (
        <div className="space-y-8 overflow-x-auto">
          {state.items.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-white/10 bg-black/15 p-4"
            >
              <div className="flex flex-wrap gap-3 text-xs text-white/70">
                <span>
                  <span className="text-white/45">Created:</span>{" "}
                  {formatIso(row.createdAt)}
                </span>
                <span>
                  <span className="text-white/45">Publish after:</span>{" "}
                  {formatIso(row.publishAfter)}
                </span>
                <span>
                  <span className="text-white/45">Last attempt:</span>{" "}
                  {formatIso(row.lastAttemptAt)}
                </span>
                <span>
                  <span className="text-white/45">Delivered:</span>{" "}
                  {formatIso(row.deliveredAt)}
                </span>
                <span>
                  <span className="text-white/45">Payload schema:</span> v
                  {row.payloadSchemaVersion ?? 1}
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-white/40">
                    Event / categories
                  </div>
                  <div className="text-sm font-semibold text-white">{row.eventType}</div>
                  <div className="text-xs text-white/55">
                    {[row.lifecycleCategory, row.operationalEventCategory]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-white/40">
                    State / attempts
                  </div>
                  <div className="text-sm font-semibold text-white">{row.processingState}</div>
                  <div className="text-xs text-white/55">
                    attempts={row.attempts}
                    {row.processingStartedAt ? (
                      <span className="block">
                        claimed {formatIso(row.processingStartedAt)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                  <div className="text-[10px] uppercase tracking-wide text-white/40">
                    Correlation
                  </div>
                  <div className="break-all font-mono text-xs text-white/70">
                    {row.correlationId ?? "—"}
                  </div>
                </div>
              </div>

              {row.processingError ? (
                <p className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                  {row.processingError}
                </p>
              ) : null}

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-white/40">
                    Payload summary
                  </div>
                  <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-white/10 bg-black/30 p-2 font-mono text-[11px] text-white/60">
                    {truncateJson(row.payloadJson, 900)}
                  </pre>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-white/40">
                    Pipeline result summary
                  </div>
                  <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-white/10 bg-black/30 p-2 font-mono text-[11px] text-white/60">
                    {truncateJson(row.lastDeliveryResultJson, 900)}
                  </pre>
                </div>
              </div>

              {row.deliveryAttempts && row.deliveryAttempts.length > 0 ? (
                <div className="mt-4 border-t border-white/10 pt-3">
                  <div className="text-[10px] uppercase tracking-wide text-white/40">
                    Recent delivery attempts
                  </div>
                  <ul className="mt-2 space-y-2">
                    {row.deliveryAttempts.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/75"
                      >
                        <span className="font-semibold text-white">
                          #{a.attemptNo}
                        </span>{" "}
                        · {a.channel} · {a.success ? "ok" : "fail"}
                        {a.dryRun ? " · dry-run" : " · live"} · {formatIso(a.createdAt)}
                        <span className="mt-1 block text-[10px] text-white/50">
                          {[a.providerKind, a.notificationCategory, a.templateKey, a.templateVersion != null ? `v${a.templateVersion}` : null]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                        {a.errorMessage ? (
                          <span className="mt-1 block text-red-200/90">{a.errorMessage}</span>
                        ) : null}
                        <span className="mt-1 block font-mono text-[10px] text-white/45">
                          {truncateJson(a.resultJson, 160)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
