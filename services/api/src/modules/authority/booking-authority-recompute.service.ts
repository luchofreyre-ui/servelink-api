import { Injectable, NotFoundException } from "@nestjs/common";
import { BookingAuthorityReviewStatus } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { parseAuthorityStringArrayJson } from "./booking-authority-json.util";
import { BookingIntelligenceService } from "./booking-intelligence.service";
import { toBookingAuthorityResultAdminResponse } from "./dto/booking-authority-admin.dto";

function stringArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export type BookingAuthorityRecomputeUiOutcome =
  | "recomputed"
  | "recomputed_unchanged"
  | "skipped_overridden"
  | "derived_preview_only";

function buildRecomputeUiFields(
  outcome: "applied" | "skipped_overridden" | "no_persisted_row",
  unchanged?: boolean,
): {
  uiOutcome: BookingAuthorityRecomputeUiOutcome;
  uiSummary: string;
  uiDetail: string;
} {
  if (outcome === "no_persisted_row") {
    return {
      uiOutcome: "derived_preview_only",
      uiSummary: "No saved authority row",
      uiDetail:
        "Resolver output is preview-only; nothing was written. Create or persist authority before a full recompute can save.",
    };
  }
  if (outcome === "skipped_overridden") {
    return {
      uiOutcome: "skipped_overridden",
      uiSummary: "Skipped — overridden",
      uiDetail:
        "This booking’s tags are admin-overridden. Recompute does not overwrite them by default.",
    };
  }
  if (unchanged) {
    return {
      uiOutcome: "recomputed_unchanged",
      uiSummary: "Checked — already in sync",
      uiDetail: "Saved tags already matched the resolver; no database update was needed.",
    };
  }
  return {
    uiOutcome: "recomputed",
    uiSummary: "Recomputed and saved",
    uiDetail: "Classifier tags were refreshed from the current resolver output.",
  };
}

function sameResolvedAsRow(
  row: {
    surfacesJson: string;
    problemsJson: string;
    methodsJson: string;
    reasonsJson: string;
  },
  resolved: {
    surfaces: string[];
    problems: string[];
    methods: string[];
    reasons: string[];
  },
): boolean {
  return (
    stringArraysEqual(parseAuthorityStringArrayJson(row.surfacesJson), resolved.surfaces) &&
    stringArraysEqual(parseAuthorityStringArrayJson(row.problemsJson), resolved.problems) &&
    stringArraysEqual(parseAuthorityStringArrayJson(row.methodsJson), resolved.methods) &&
    stringArraysEqual(parseAuthorityStringArrayJson(row.reasonsJson), resolved.reasons)
  );
}

export type BookingAuthorityRecomputeResultPayload = {
  kind: "booking_authority_recompute_result";
  outcome: "applied" | "skipped_overridden" | "no_persisted_row";
  /** Stable labels for admin UI (maps from `outcome` + `unchanged`). */
  uiOutcome: BookingAuthorityRecomputeUiOutcome;
  uiSummary: string;
  uiDetail: string;
  bookingId: string;
  /** Present when resolver ran (always except booking missing). */
  resolvedPreview?: {
    surfaces: string[];
    problems: string[];
    methods: string[];
    reasons: string[];
  };
  /** When outcome is `applied`, whether tag JSON matched resolver before update. */
  unchanged?: boolean;
  persistedStatus?: BookingAuthorityReviewStatus;
  /** Admin DTO when a persisted row exists after apply, or before skip. */
  persisted?: ReturnType<typeof toBookingAuthorityResultAdminResponse>;
};

@Injectable()
export class BookingAuthorityRecomputeService {
  constructor(
    private readonly db: PrismaService,
    private readonly intelligence: BookingIntelligenceService,
  ) {}

  async recomputeForBooking(bookingId: string): Promise<BookingAuthorityRecomputeResultPayload> {
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      include: { estimateSnapshot: true },
    });
    if (!booking) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }

    const resolved = this.intelligence.resolveTags({
      notes: booking.notes,
      metadata: booking.estimateSnapshot
        ? {
            estimateInputJson: booking.estimateSnapshot.inputJson,
            estimateOutputJson: booking.estimateSnapshot.outputJson,
          }
        : null,
    });

    const preview = {
      surfaces: resolved.surfaces,
      problems: resolved.problems,
      methods: resolved.methods,
      reasons: resolved.reasons,
    };

    const row = await this.db.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });

    if (!row) {
      const ui = buildRecomputeUiFields("no_persisted_row");
      return {
        kind: "booking_authority_recompute_result",
        outcome: "no_persisted_row",
        ...ui,
        bookingId,
        resolvedPreview: preview,
      };
    }

    if (row.status === BookingAuthorityReviewStatus.overridden) {
      const ui = buildRecomputeUiFields("skipped_overridden");
      return {
        kind: "booking_authority_recompute_result",
        outcome: "skipped_overridden",
        ...ui,
        bookingId,
        persistedStatus: row.status,
        resolvedPreview: preview,
        persisted: toBookingAuthorityResultAdminResponse(row),
      };
    }

    if (sameResolvedAsRow(row, resolved)) {
      const ui = buildRecomputeUiFields("applied", true);
      return {
        kind: "booking_authority_recompute_result",
        outcome: "applied",
        ...ui,
        bookingId,
        unchanged: true,
        resolvedPreview: preview,
        persisted: toBookingAuthorityResultAdminResponse(row),
      };
    }

    const updated = await this.db.bookingAuthorityResult.update({
      where: { bookingId },
      data: {
        surfacesJson: JSON.stringify(resolved.surfaces),
        problemsJson: JSON.stringify(resolved.problems),
        methodsJson: JSON.stringify(resolved.methods),
        reasonsJson: JSON.stringify(resolved.reasons),
        resolutionVersion: row.resolutionVersion + 1,
      },
    });

    const ui = buildRecomputeUiFields("applied", false);
    return {
      kind: "booking_authority_recompute_result",
      outcome: "applied",
      ...ui,
      bookingId,
      unchanged: false,
      resolvedPreview: preview,
      persisted: toBookingAuthorityResultAdminResponse(updated),
    };
  }
}
