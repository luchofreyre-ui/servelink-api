"use client";

import type {
  AdminBookingAuthorityBlock,
  AdminBookingAuthorityDerivedSnapshot,
  AdminBookingAuthorityOperatorHints,
  AdminBookingAuthorityPersistedSnapshot,
} from "@/lib/api/adminBookingCommandCenter";
import { formatTopTagsDisplay } from "@/lib/admin/commandCenterAuthorityDisplay";

/** Fallback when the API omits `operatorHints` (older clients). Prefer API values. */
function deriveOperatorHintsFromSnapshots(
  authority: Pick<AdminBookingAuthorityBlock, "persisted" | "derived">,
): AdminBookingAuthorityOperatorHints {
  const p = authority.persisted;
  if (p) {
    const overridden = p.status === "overridden";
    return {
      hasPersistedRow: true,
      persistedStatus: p.status,
      recomputeSkipsOverwrite: overridden,
      recomputeMayRefreshPersistedRow: !overridden,
      recomputePreviewOnly: false,
    };
  }
  return {
    hasPersistedRow: false,
    persistedStatus: null,
    recomputeSkipsOverwrite: false,
    recomputeMayRefreshPersistedRow: false,
    recomputePreviewOnly: true,
  };
}

function normalizeAuthority(
  authority: AdminBookingAuthorityBlock | null | undefined,
): AdminBookingAuthorityBlock {
  const persisted = authority?.persisted ?? null;
  const derived = authority?.derived ?? null;
  const operatorHints =
    authority?.operatorHints ?? deriveOperatorHintsFromSnapshots({ persisted, derived });
  return { persisted, derived, operatorHints };
}

function operatorWorkflowCopy(h: AdminBookingAuthorityOperatorHints): string | null {
  if (h.recomputeSkipsOverwrite) {
    return "Recompute runs but will not overwrite admin-overridden tags.";
  }
  if (h.recomputeMayRefreshPersistedRow) {
    return "Recompute can refresh saved classifier tags for auto or reviewed rows.";
  }
  if (h.recomputePreviewOnly) {
    return "No saved authority row — recompute returns a preview only until a row exists.";
  }
  return null;
}

function reviewStatusLabel(
  persisted: AdminBookingAuthorityPersistedSnapshot | null,
  persistedHasTags: boolean,
  derivedHasTags: boolean,
  hasRows: boolean,
): string {
  if (!hasRows) {
    if (persisted != null && !persistedHasTags && !derivedHasTags) {
      switch (persisted.status) {
        case "reviewed":
          return "Reviewed";
        case "overridden":
          return "Overridden";
        default:
          return "Auto";
      }
    }
    return "None";
  }
  if (persistedHasTags && persisted) {
    switch (persisted.status) {
      case "reviewed":
        return "Reviewed";
      case "overridden":
        return "Overridden";
      default:
        return "Auto";
    }
  }
  return "Estimated";
}

function reviewStatusPillClass(
  persisted: AdminBookingAuthorityPersistedSnapshot | null,
  persistedHasTags: boolean,
  derivedHasTags: boolean,
  hasRows: boolean,
): string {
  if (!hasRows) {
    if (persisted != null && !persistedHasTags && !derivedHasTags) {
      switch (persisted.status) {
        case "reviewed":
          return "border-emerald-500/45 bg-emerald-500/10 text-emerald-100";
        case "overridden":
          return "border-violet-500/45 bg-violet-500/12 text-violet-100";
        default:
          return "border-sky-500/40 bg-sky-500/10 text-sky-100";
      }
    }
    return "border-white/15 bg-white/5 text-white/55";
  }
  if (persistedHasTags && persisted) {
    switch (persisted.status) {
      case "reviewed":
        return "border-emerald-500/45 bg-emerald-500/10 text-emerald-100";
      case "overridden":
        return "border-violet-500/45 bg-violet-500/12 text-violet-100";
      default:
        return "border-sky-500/40 bg-sky-500/10 text-sky-100";
    }
  }
  if (derivedHasTags) {
    return "border-white/20 bg-white/10 text-white/85";
  }
  return "border-white/15 bg-white/5 text-white/55";
}

function hasTagData(
  snap: AdminBookingAuthorityPersistedSnapshot | AdminBookingAuthorityDerivedSnapshot,
): boolean {
  return (
    snap.surfaces.length > 0 ||
    snap.problems.length > 0 ||
    snap.methods.length > 0
  );
}

function statusBadgeTitle(statusText: string): string {
  switch (statusText) {
    case "Auto":
      return "Review status: Auto — classifier output is saved for this booking.";
    case "Reviewed":
      return "Review status: Reviewed — a reviewer confirmed this classification.";
    case "Overridden":
      return "Review status: Overridden — tags were set or adjusted by an admin.";
    case "Estimated":
      return "Review status: Estimated — tags come from a live parse of booking text (no saved row with data).";
    case "None":
      return "No classifier tags are available to display for this booking.";
    default:
      return `Review status: ${statusText}`;
  }
}

function statusHelpLine(statusText: string): string | null {
  switch (statusText) {
    case "Auto":
      return "Saved classifier output.";
    case "Reviewed":
      return "Reviewer confirmed this classification.";
    case "Overridden":
      return "Admin-set or adjusted tags.";
    case "Estimated":
      return "Live parse from booking text — not the saved row.";
    default:
      return null;
  }
}

function formatShortAudit(iso: string | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminCommandCenterAuthorityStrip(props: {
  loading?: boolean;
  error?: string | null;
  authority?: AdminBookingAuthorityBlock | null;
  variant?: "standalone" | "embedded";
}) {
  const { loading, error, authority: raw, variant = "standalone" } = props;
  const authority = normalizeAuthority(raw ?? undefined);
  const frameClass =
    variant === "embedded"
      ? "rounded-xl border border-white/10 bg-black/25 px-4 py-3.5"
      : "rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5";
  const outerSpacing = variant === "standalone" ? "mb-5" : "";

  if (loading) {
    return (
      <div
        role="region"
        aria-label="Command center authority — booking tags"
        data-testid="admin-command-center-authority-strip"
        className={`${frameClass} ${outerSpacing} text-sm text-white/55`}
      >
        Loading booking authority tags…
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="region"
        aria-label="Command center authority — booking tags"
        data-testid="admin-command-center-authority-strip"
        className={`rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3.5 text-sm text-amber-100/90 ${outerSpacing}`}
      >
        Could not load authority tags: {error}
      </div>
    );
  }

  const persisted = authority.persisted;
  const derived = authority.derived;
  const persistedHasTags = persisted != null && hasTagData(persisted);
  const derivedHasTags = derived != null && hasTagData(derived);
  const activeSurfaces = persistedHasTags
    ? persisted!.surfaces
    : derived?.surfaces ?? [];
  const activeProblems = persistedHasTags
    ? persisted!.problems
    : derived?.problems ?? [];
  const activeMethods = persistedHasTags
    ? persisted!.methods
    : derived?.methods ?? [];
  const hasRows =
    activeSurfaces.length > 0 ||
    activeProblems.length > 0 ||
    activeMethods.length > 0;

  const statusText = reviewStatusLabel(
    persisted,
    persistedHasTags,
    derivedHasTags,
    hasRows,
  );
  const pillClass = reviewStatusPillClass(
    persisted,
    persistedHasTags,
    derivedHasTags,
    hasRows,
  );

  const helpLine = statusHelpLine(statusText);
  const hints =
    authority.operatorHints ??
    deriveOperatorHintsFromSnapshots({
      persisted: authority.persisted,
      derived: authority.derived,
    });
  const workflowLine = operatorWorkflowCopy(hints);
  const auditUpdated =
    persistedHasTags && persisted?.updatedAt
      ? formatShortAudit(persisted.updatedAt)
      : null;
  const auditCreated =
    persistedHasTags && persisted?.createdAt
      ? formatShortAudit(persisted.createdAt)
      : null;

  return (
    <div
      role="region"
      aria-label="Command center authority — booking tags"
      data-testid="admin-command-center-authority-strip"
      className={`${frameClass} ${outerSpacing}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            {variant === "embedded" ? "Tags" : "Booking authority"}
          </p>
          <p className="mt-1 text-sm font-medium text-white/90">
            Surfaces, problems &amp; methods
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
            Status
          </span>
          <span
            data-testid="admin-command-center-authority-review-status"
            title={statusBadgeTitle(statusText)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pillClass}`}
          >
            {statusText}
          </span>
        </div>
      </div>

      {helpLine ? (
        <p className="mt-2 text-[11px] leading-relaxed text-white/45">{helpLine}</p>
      ) : null}

      {workflowLine ? (
        <p
          className="mt-2 text-[11px] leading-relaxed text-sky-100/75"
          data-testid="admin-command-center-authority-workflow-hint"
        >
          {workflowLine}
        </p>
      ) : null}

      {auditUpdated || auditCreated ? (
        <p className="mt-1.5 text-[11px] text-white/35">
          {auditCreated && auditUpdated && auditCreated !== auditUpdated
            ? `Saved ${auditCreated} · Updated ${auditUpdated}`
            : auditUpdated
              ? `Updated ${auditUpdated}`
              : auditCreated
                ? `Saved ${auditCreated}`
                : null}
        </p>
      ) : null}

      {!hasRows ? (
        <p
          className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-relaxed text-white/50"
          data-testid="admin-command-center-authority-empty"
        >
          {statusText === "None"
            ? "No classifier tags to show yet — nothing matched from notes or there is no stored row with tag lists."
            : "No tag lists to display. The saved record may be empty, or tags are waiting on resolver output."}
        </p>
      ) : (
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
              Surfaces
            </dt>
            <dd
              className="mt-1.5 break-words font-mono text-[13px] leading-snug text-white/88"
              data-testid="admin-command-center-authority-surfaces"
            >
              {formatTopTagsDisplay(activeSurfaces)}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
              Problems
            </dt>
            <dd
              className="mt-1.5 break-words font-mono text-[13px] leading-snug text-white/88"
              data-testid="admin-command-center-authority-problems"
            >
              {formatTopTagsDisplay(activeProblems)}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
              Methods
            </dt>
            <dd
              className="mt-1.5 break-words font-mono text-[13px] leading-snug text-white/88"
              data-testid="admin-command-center-authority-methods"
            >
              {formatTopTagsDisplay(activeMethods)}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
