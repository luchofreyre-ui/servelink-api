import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import {
  BookingEventType,
  BookingStatus,
  OpsAlertSeverity,
  OpsAlertStatus,
  OpsAnomalyType,
} from "@prisma/client";

import { PrismaService } from "../../prisma";
import { ok, fail } from "../../utils/http";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";

type AuthedRequest = {
  user?: { userId: string; role: "customer" | "fo" | "admin" };
};

type AnomalyType =
  | "INTEGRITY_REFUND_WEBHOOK_MISSING"
  | "INTEGRITY_DISPUTE_STALE"
  | "INTEGRITY_BILLING_SESSION_STALE";

type AckBody = {
  eventId?: string;
  fingerprint?: string;
  note?: string;
};

type BulkAckBody = {
  eventIds?: string[];
  fingerprints?: string[];
  note?: string;
};

type AckQueryBody = {
  sinceHours?: number | string;
  limit?: number | string;
  groupBy?: string; // "fingerprint" supported
  type?: string;
  bookingId?: string;
  status?: string; // booking status
  foId?: string;

  opsStatus?: string; // open|acked (OpsAlert.status)
  severity?: string; // info|warning|critical

  note?: string;
};

type ResolveBody = {
  eventId?: string;
  fingerprint?: string;
  note?: string;
};

type BulkResolveBody = {
  eventIds?: string[];
  note?: string;
};

type ResolveQueryBody = {
  sinceHours?: number | string;
  limit?: number | string;
  groupBy?: string; // "fingerprint" supported
  type?: string;
  bookingId?: string;
  status?: string; // booking status
  foId?: string;
  opsStatus?: string; // open|acked
  severity?: string; // info|warning|critical
  note?: string;
};

type AssignBody = {
  eventId?: string;
  fingerprint?: string;
  adminId?: string | null; // null => unassign
  assignedToAdminId?: string | null; // backward compat
};

const ACK_TYPE = "OPS_ANOMALY_ACK";

@Controller("/api/v1/admin/ops")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AnomaliesAdminController {
  constructor(private readonly db: PrismaService) {}

  @Get("anomalies")
  async list(
    @Req() req: AuthedRequest,
    @Query("sinceHours") sinceHoursRaw?: string,
    @Query("limit") limitRaw?: string,
    @Query("type") typeRaw?: string,
    @Query("bookingId") bookingIdRaw?: string,
    @Query("status") statusRaw?: string,
    @Query("opsStatus") opsStatusRaw?: string, // open|acked
    @Query("severity") severityRaw?: string, // info|warning|critical
    @Query("assignedToAdminId") assignedToAdminIdRaw?: string, // filter by owner (admin user id)
    @Query("foId") foIdRaw?: string,
    @Query("cursor") cursorRaw?: string,
    @Query("sort") sortRaw?: string,
    @Query("sortBy") sortByRaw?: string, // createdAt|lastSeenAt (default lastSeenAt)
    @Query("includePayload") includePayloadRaw?: string,
    @Query("acked") ackedRaw?: string, // 0|1, default 0 (hide acked)
    @Query("mine") mineRaw?: string, // 0|1, default 0
    @Query("includeUnassigned") includeUnassignedRaw?: string, // 0|1, default 0
    @Query("unassigned") unassignedRaw?: string, // 0|1, default 0
    @Query("sla") slaRaw?: string, // dueSoon|overdue|breached
    @Query("slaWindowMin") slaWindowMinRaw?: string, // only for dueSoon
    @Query("groupBy") groupByRaw?: string, // fingerprint
  ) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const sinceHours = sinceHoursRaw ? Number(sinceHoursRaw) : 168; // default 7 days
    const limit = limitRaw ? Number(limitRaw) : 50;

    if (!Number.isFinite(sinceHours) || sinceHours <= 0) {
      return fail("INVALID_REQUEST", "sinceHours must be a positive number");
    }
    if (!Number.isFinite(limit) || limit <= 0 || limit > 200) {
      return fail("INVALID_REQUEST", "limit must be between 1 and 200");
    }

    const bookingId = bookingIdRaw ? String(bookingIdRaw).trim() : null;
    const status = statusRaw ? String(statusRaw).trim() : null;
    const foId = foIdRaw ? String(foIdRaw).trim() : null;

    const opsStatus = opsStatusRaw ? String(opsStatusRaw).trim() : null;
    const severity = severityRaw ? String(severityRaw).trim() : null;

    if (status !== null) {
      const allowedStatuses = Object.values(BookingStatus);
      if (!allowedStatuses.includes(status as BookingStatus)) {
        return fail(
          "INVALID_REQUEST",
          `status must be one of: ${allowedStatuses.join(", ")}`,
        );
      }
    }

    if (opsStatus !== null) {
      const allowedOpsStatuses = Object.values(OpsAlertStatus);
      if (!allowedOpsStatuses.includes(opsStatus as OpsAlertStatus)) {
        return fail(
          "INVALID_REQUEST",
          `opsStatus must be one of: ${allowedOpsStatuses.join(", ")}`,
        );
      }
    }

    if (severity !== null) {
      const allowedSeverities = Object.values(OpsAlertSeverity);
      if (!allowedSeverities.includes(severity as OpsAlertSeverity)) {
        return fail(
          "INVALID_REQUEST",
          `severity must be one of: ${allowedSeverities.join(", ")}`,
        );
      }
    }

    if (bookingId !== null && bookingId.length === 0) {
      return fail("INVALID_REQUEST", "bookingId must be a non-empty string");
    }
    if (status !== null && status.length === 0) {
      return fail("INVALID_REQUEST", "status must be a non-empty string");
    }
    if (foId !== null && foId.length === 0) {
      return fail("INVALID_REQUEST", "foId must be a non-empty string");
    }
    if (opsStatus !== null && opsStatus.length === 0) {
      return fail("INVALID_REQUEST", "opsStatus must be a non-empty string");
    }
    if (severity !== null && severity.length === 0) {
      return fail("INVALID_REQUEST", "severity must be a non-empty string");
    }

    const assignedToAdminId = assignedToAdminIdRaw
      ? String(assignedToAdminIdRaw).trim()
      : null;

    if (assignedToAdminId !== null && assignedToAdminId.length === 0) {
      return fail("INVALID_REQUEST", "assignedToAdminId must be a non-empty string");
    }

    const allowed: AnomalyType[] = [
      "INTEGRITY_REFUND_WEBHOOK_MISSING",
      "INTEGRITY_DISPUTE_STALE",
      "INTEGRITY_BILLING_SESSION_STALE",
    ];

    const type = typeRaw ? (String(typeRaw) as AnomalyType) : null;
    if (type && !allowed.includes(type)) {
      return fail(
        "INVALID_REQUEST",
        `type must be one of: ${allowed.join(", ")}`,
      );
    }

    const sort = sortRaw ? String(sortRaw).toLowerCase() : "desc";
    if (sort !== "desc" && sort !== "asc") {
      return fail("INVALID_REQUEST", "sort must be one of: desc, asc");
    }

    // Backwards-compatible default: include payloads by default.
    const includePayload =
      includePayloadRaw === undefined
        ? true
        : String(includePayloadRaw).trim() !== "0";

    // Default is to HIDE acked anomalies (acked=0). If acked=1, include acked anomalies.
    const includeAcked =
      ackedRaw === undefined ? false : String(ackedRaw).trim() === "1";

    const mine = mineRaw ? String(mineRaw).trim() === "1" : false;
    const includeUnassigned =
      includeUnassignedRaw ? String(includeUnassignedRaw).trim() === "1" : false;

    const unassigned =
      unassignedRaw ? String(unassignedRaw).trim() === "1" : false;

    const sla = slaRaw ? String(slaRaw).trim() : null;

    const allowedSla = ["dueSoon", "overdue", "breached"] as const;
    if (sla !== null && !allowedSla.includes(sla as any)) {
      return fail(
        "INVALID_REQUEST",
        `sla must be one of: ${allowedSla.join(", ")}`,
      );
    }

    const slaWindowMin =
      slaWindowMinRaw !== undefined ? Number(slaWindowMinRaw) : 30;

    if (sla === "dueSoon") {
      if (!Number.isFinite(slaWindowMin) || slaWindowMin <= 0 || slaWindowMin > 24 * 60) {
        return fail(
          "INVALID_REQUEST",
          "slaWindowMin must be between 1 and 1440 minutes",
        );
      }
    }

    const groupBy = groupByRaw ? String(groupByRaw).trim() : null;
    if (groupBy !== null && groupBy !== "fingerprint") {
      return fail("INVALID_REQUEST", "groupBy must be: fingerprint");
    }

    const cursor = cursorRaw ? String(cursorRaw).trim() : null;
    if (cursor !== null && cursor.length === 0) {
      return fail("INVALID_REQUEST", "cursor must be a non-empty string");
    }

    // If mine=1 and caller didn't specify sortBy, default to lastSeenAt for work-queue behavior.
    const sortBy =
      sortByRaw !== undefined
        ? String(sortByRaw).trim()
        : mine
          ? "lastSeenAt"
          : "createdAt";

    if (sortBy !== "createdAt" && sortBy !== "lastSeenAt" && sortBy !== "severity") {
      return fail("INVALID_REQUEST", "sortBy must be one of: createdAt, lastSeenAt, severity");
    }

    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

    const nowDate = new Date();
    const dueSoonUntil = new Date(nowDate.getTime() + slaWindowMin * 60 * 1000);

    // --- OpsAlert-backed inbox (with legacy materialization on first page) ---
    const take = Math.floor(limit);

    const alertWhere: any = {
      bookingId: bookingId ?? undefined,
      foId: foId ?? undefined,
      bookingStatus: status ? (status as any) : undefined,
      anomalyType: type ? (type as any) : undefined,
      ...(opsStatus
        ? { status: opsStatus as any }
        : includeAcked
          ? {}
          : { status: "open" }),
      ...(severity ? { severity: severity as any } : {}),
      lastSeenAt: { gte: since },
      ...(sla === "dueSoon"
        ? {
            slaDueAt: { not: null, gte: nowDate, lt: dueSoonUntil },
            slaBreachedAt: null,
          }
        : sla === "overdue"
          ? {
              slaDueAt: { not: null, lt: nowDate },
              slaBreachedAt: null,
            }
          : sla === "breached"
            ? {
                slaBreachedAt: { not: null },
              }
            : {}),
      ...(assignedToAdminId
        ? { assignedToAdminId }
        : unassigned
          ? { assignedToAdminId: null }
          : mine
            ? {
                OR: [
                  { assignedToAdminId: req.user?.userId ?? "__none__" },
                  ...(includeUnassigned ? [{ assignedToAdminId: null }] : []),
                ],
              }
            : {}),
    };

    // Prisma doesn't like explicit undefined fields sometimes; clean it.
    for (const k of Object.keys(alertWhere)) {
      if (alertWhere[k] === undefined) delete alertWhere[k];
    }

    const orderBy =
      sortBy === "severity"
        ? [
            { severity: sort as "asc" | "desc" },
            { lastSeenAt: "desc" as const },
            { createdAt: "desc" as const },
          ]
        : [{ [sortBy]: sort as "asc" | "desc" }];

    const findArgs: any = {
      where: alertWhere,
      orderBy,
      take,
    };

    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1;
    }

    // Legacy materialization: the E2E test creates anomalies as BookingEvent NOTE rows.
    // To keep backward compatibility and avoid flakiness, materialize recent legacy events
    // into OpsAlert on the first page (no cursor) before querying OpsAlert.
    if (!cursor) {
      // Legacy materialization is expensive; make it incremental.
      // We persist a watermark so we only scan new NOTE events once.
      const legacyWatermarkKey = "ops:legacy_materialized_through";
      const legacyWatermark = await this.db.systemSetting.findUnique({
        where: { key: legacyWatermarkKey },
      });

      const watermarkDate = legacyWatermark?.value
        ? new Date(String(legacyWatermark.value))
        : null;

      // We never scan earlier than `since` (user's requested window),
      // but we also don't rescan what we already materialized.
      const legacyScanSince = watermarkDate && watermarkDate > since ? watermarkDate : since;

      const legacyScanNow = new Date();

      const pageSize = Math.min(200, take * 3);

      const legacyWhere: any = {
        type: BookingEventType.NOTE,
        createdAt: { gte: legacyScanSince },
        note: { not: null },
        ...(bookingId ? { bookingId } : {}),
        ...(status || foId
          ? {
              Booking: {
                ...(status ? { status: status as any } : {}),
                ...(foId ? { foId } : {}),
              },
            }
          : {}),
      };

      if (type) {
        legacyWhere.note = { not: null, contains: `"type":"${type}"` };
      } else {
        legacyWhere.note = { not: null, contains: `"type":"INTEGRITY_` };
      }

      const legacyEvents = (await this.db.bookingEvent.findMany({
        where: legacyWhere,
        orderBy: { createdAt: sort as "asc" | "desc" },
        take: pageSize,
        include: {
          Booking: { select: { status: true, foId: true } },
        } as any,
      })) as unknown as Array<any>;

      for (const e of legacyEvents) {
        let anomalyTypeEnum: OpsAnomalyType = OpsAnomalyType.UNKNOWN;

        try {
          const parsed = e.note ? JSON.parse(String(e.note)) : null;
          const t = parsed?.type ? String(parsed.type) : null;

          if (t && allowed.includes(t as any)) {
            anomalyTypeEnum = t as unknown as OpsAnomalyType;
          } else if (t && String(t).startsWith("INTEGRITY_")) {
            // keep integrity-ish unknowns searchable
            anomalyTypeEnum = OpsAnomalyType.UNKNOWN;
          } else {
            continue;
          }
        } catch {
          // If legacy note is malformed JSON, skip materialization (inbox can still show UNKNOWN via OpsAlert later)
          continue;
        }

        try {
          const now = new Date();
          const severity: "info" | "warning" | "critical" =
            anomalyTypeEnum === OpsAnomalyType.INTEGRITY_BILLING_SESSION_STALE
              ? "critical"
              : "warning";
          const fingerprint = `${String(anomalyTypeEnum)}:${String(e.bookingId)}`;
          await this.db.opsAlert.upsert({
            where: { sourceEventId: e.id },
            create: {
              sourceEventId: e.id,
              bookingId: e.bookingId,
              foId: e.Booking?.foId ?? null,
              bookingStatus: e.Booking?.status ?? null,
              anomalyType: anomalyTypeEnum,
              status: "open",
              fingerprint,
              firstSeenAt: e.createdAt,
              lastSeenAt: e.createdAt,
              occurrences: 1,
              payloadJson: e.note ? String(e.note) : null,
              slaDueAt: new Date(
                now.getTime() +
                  (severity === "critical" ? 30 : 4 * 60) * 60 * 1000,
              ),
            },
            // Do NOT overwrite ack fields/status on update; only refresh metadata/payload.
            update: {
              bookingId: e.bookingId,
              foId: e.Booking?.foId ?? null,
              bookingStatus: e.Booking?.status ?? null,
              anomalyType: anomalyTypeEnum,
              payloadJson: e.note ? String(e.note) : null,
              fingerprint,
              lastSeenAt: e.createdAt,
            },
          });

          // ---- Rollup materialization (fingerprint queue) ----
          // Legacy NOTE anomalies must also populate OpsAlertRollup, otherwise groupBy=fingerprint has nothing to show.
          try {
            await this.db.opsAlertRollup.upsert({
              where: { fingerprint },
              create: {
                fingerprint,
                anomalyType: anomalyTypeEnum,
                severity: severity as any,
                status: "open",
                occurrences: 1,
                firstSeenAt: e.createdAt,
                lastSeenAt: e.createdAt,

                // mirror SLA fields (legacy defaults: critical=30m, else 4h)
                slaDueAt: new Date(
                  now.getTime() + (severity === "critical" ? 30 : 4 * 60) * 60 * 1000,
                ),
                slaBreachedAt: null,

                // helpful denorm fields for filtering
                bookingId: e.bookingId,
                foId: e.Booking?.foId ?? null,
                bookingStatus: e.Booking?.status ?? null,
                assignedToAdminId: null,
              } as any,
              update: {
                // increment occurrences and bump recency
                occurrences: { increment: 1 },
                lastSeenAt: e.createdAt,

                // keep denorm fields fresh
                bookingId: e.bookingId,
                foId: e.Booking?.foId ?? null,
                bookingStatus: e.Booking?.status ?? null,

                // keep severity/type in sync (safe)
                anomalyType: anomalyTypeEnum,
                severity: severity as any,

                // do NOT overwrite assignment/acked/resolved fields here
              } as any,
            });
          } catch (err: any) {
            if (err?.code !== "P2002") throw err;
          }

          // Rollup materialization (idempotent): compute occurrences from evidence rows
          // IMPORTANT: never clobber human actions (status/assignment/ack/resolve) during legacy materialization.
          // Also: use firstSeenAt/lastSeenAt (not createdAt) for recency.

          const occurrences = await this.db.opsAlert.count({
            where: { fingerprint },
          });

          const first = await this.db.opsAlert.findFirst({
            where: { fingerprint },
            orderBy: { firstSeenAt: "asc" },
            select: { firstSeenAt: true },
          });

          const last = await this.db.opsAlert.findFirst({
            where: { fingerprint },
            orderBy: { lastSeenAt: "desc" },
            select: {
              lastSeenAt: true,
              anomalyType: true,
              severity: true,
              slaDueAt: true,

              bookingId: true,
              foId: true,
              bookingStatus: true,
            },
          });

          if (first && last) {
            await this.db.opsAlertRollup.upsert({
              where: { fingerprint },
              create: {
                fingerprint,
                anomalyType: last.anomalyType as any,
                severity: last.severity as any,
                status: "open",
                occurrences,
                firstSeenAt: first.firstSeenAt,
                lastSeenAt: last.lastSeenAt,
                slaDueAt: last.slaDueAt ?? null,
                slaBreachedAt: null,
                assignedToAdminId: null,
                bookingId: last.bookingId ?? null,
                foId: last.foId ?? null,
                bookingStatus: last.bookingStatus ?? null,
              } as any,
              update: {
                // Safe to refresh these from evidence:
                anomalyType: last.anomalyType as any,
                severity: last.severity as any,
                occurrences,
                firstSeenAt: first.firstSeenAt,
                lastSeenAt: last.lastSeenAt,
                bookingId: last.bookingId ?? null,
                foId: last.foId ?? null,
                bookingStatus: last.bookingStatus ?? null,

                // Only update slaDueAt if it is currently null (don't fight active SLA/triage state).
                ...(last.slaDueAt
                  ? { slaDueAt: last.slaDueAt }
                  : {}),
              } as any,
            });
          }
        } catch (err: any) {
          // sourceEventId is unique; if we lose a race, ignore
          if (err?.code !== "P2002") throw err;
        }
      }

      await this.db.systemSetting.upsert({
        where: { key: legacyWatermarkKey },
        create: { key: legacyWatermarkKey, value: legacyScanNow.toISOString() },
        update: { value: legacyScanNow.toISOString() },
      });
    }

    if (groupBy === "fingerprint") {
      const rollupWhere: any = {
        lastSeenAt: { gte: since },
        ...(bookingId ? { bookingId } : {}),
        ...(foId ? { foId } : {}),
        ...(status ? { bookingStatus: status as any } : {}),
        ...(type ? { anomalyType: type as any } : {}),
        ...(severity ? { severity: severity as any } : {}),
        ...(opsStatus ? { status: opsStatus as any } : includeAcked ? {} : { status: "open" }),
        ...(sla === "dueSoon"
          ? {
              slaDueAt: { not: null, gte: nowDate, lt: dueSoonUntil },
              slaBreachedAt: null,
            }
          : sla === "overdue"
            ? {
                slaDueAt: { not: null, lt: nowDate },
                slaBreachedAt: null,
              }
            : sla === "breached"
              ? {
                  slaBreachedAt: { not: null },
                }
              : {}),
      };

      if (unassigned) rollupWhere.assignedToAdminId = null;
      else if (mine) {
        rollupWhere.OR = [
          { assignedToAdminId: req.user?.userId ?? "__none__" },
          ...(includeUnassigned ? [{ assignedToAdminId: null }] : []),
        ];
      } else if (assignedToAdminId) {
        rollupWhere.assignedToAdminId = assignedToAdminId;
      }

      for (const k of Object.keys(rollupWhere)) {
        if (rollupWhere[k] === undefined) delete rollupWhere[k];
      }

      const rollupOrderBy =
        sortBy === "severity"
          ? [{ severity: sort }, { lastSeenAt: "desc" }, { createdAt: "desc" }]
          : [{ [sortBy]: sort }];

      const rollupArgs: any = {
        where: rollupWhere,
        orderBy: rollupOrderBy,
        take,
      };

      if (cursor) {
        rollupArgs.cursor = { fingerprint: cursor };
        rollupArgs.skip = 1;
      }

      const rows = await this.db.opsAlertRollup.findMany(rollupArgs);

      const anomalies = rows.map((r: any) => ({
        id: r.id, // cuid from OpsAlertRollup
        fingerprint: r.fingerprint,
        anomalyType: String(r.anomalyType),
        severity: String(r.severity),
        status: String(r.status),

        occurrences: r.occurrences,
        firstSeenAt: r.firstSeenAt,
        lastSeenAt: r.lastSeenAt,

        slaDueAt: r.slaDueAt,
        slaBreachedAt: r.slaBreachedAt,

        assignedToAdminId: r.assignedToAdminId,
        bookingId: r.bookingId,
        foId: r.foId,
        bookingStatus: r.bookingStatus,
      }));

      const nextCursor = rows.length > 0 ? rows[rows.length - 1].fingerprint : null;

      return ok({
        since,
        limit: take,
        count: anomalies.length,

        // Backwards-compat: tests (and likely UI) read data.anomalies
        anomalies,

        // Keep rollups too (nice for new clients)
        rollups: anomalies,

        types: allowed,
        filters: {
          bookingId: bookingId ?? undefined,
          status: status ?? undefined,
          foId: foId ?? undefined,
          type: type ?? undefined,
          opsStatus: opsStatus ?? undefined,
          severity: severity ?? undefined,
          mine: mine ? 1 : 0,
          includeUnassigned: includeUnassigned ? 1 : 0,
          unassigned: unassigned ? 1 : 0,
        },
        page: {
          sort,
          sortBy,
          cursor: cursor ?? undefined,
          nextCursor: nextCursor ?? undefined,
          includePayload,
          acked: includeAcked ? 1 : 0,
          opsStatus: opsStatus ?? undefined,
          severity: severity ?? undefined,
          mine: mine ? 1 : 0,
          includeUnassigned: includeUnassigned ? 1 : 0,
          unassigned: unassigned ? 1 : 0,
          groupBy: "fingerprint",
        },
      });
    }

    const doGroup = groupBy === "fingerprint";

    let rows: any[] = [];

    if (!doGroup) {
      rows = await this.db.opsAlert.findMany(findArgs);
    } else {
      // Rollup-backed grouped inbox
      const takeRollup = Math.floor(take);

      const rollupWhere: any = {
        bookingId: bookingId ?? undefined,
        foId: foId ?? undefined,
        bookingStatus: status ? (status as any) : undefined,
        anomalyType: type ? (type as any) : undefined,
        ...(opsStatus ? { status: opsStatus as any } : includeAcked ? {} : { status: "open" }),
        ...(severity ? { severity: severity as any } : {}),
        lastSeenAt: { gte: since },

        ...(sla === "dueSoon"
          ? {
              slaDueAt: { not: null, gte: nowDate, lt: dueSoonUntil },
              slaBreachedAt: null,
            }
          : sla === "overdue"
            ? {
                slaDueAt: { not: null, lt: nowDate },
                slaBreachedAt: null,
              }
            : sla === "breached"
              ? {
                  slaBreachedAt: { not: null },
                }
              : {}),
      };

      for (const k of Object.keys(rollupWhere)) {
        if (rollupWhere[k] === undefined) delete rollupWhere[k];
      }

      const rollupFindArgs: any = {
        where: rollupWhere,
        take: takeRollup,
      };

      // ordering: respect existing sortBy/sort behavior
      if (sortBy === "severity") {
        rollupFindArgs.orderBy = [{ severity: sort }, { lastSeenAt: "desc" }, { createdAt: "desc" }];
      } else {
        rollupFindArgs.orderBy = [{ [sortBy]: sort }];
      }

      if (cursor) {
        rollupFindArgs.cursor = { fingerprint: cursor };
        rollupFindArgs.skip = 1;
      }

      // mine/unassigned filters should apply here too
      if (unassigned) {
        rollupFindArgs.where.assignedToAdminId = null;
      } else if (mine) {
        rollupFindArgs.where.OR = [
          { assignedToAdminId: req.user?.userId ?? "__none__" },
          ...(includeUnassigned ? [{ assignedToAdminId: null }] : []),
        ];
      } else if (assignedToAdminId) {
        rollupFindArgs.where.assignedToAdminId = assignedToAdminId;
      }

      rows = await this.db.opsAlertRollup.findMany(rollupFindArgs);
    }

    const anomalies = rows
      .map((r: any) => {
        // keep API contract: anomaly "id" = source event id when present (OpsAlert), else row id (rollup)
        const base = {
          id: r.sourceEventId ?? r.id,
          bookingId: r.bookingId,
          foId: r.foId ?? null,
          bookingStatus: r.bookingStatus ?? null,

          createdAt: r.createdAt,
          anomalyType: String(r.anomalyType),

          fingerprint: r.fingerprint ?? null,
          occurrences: r.occurrences ?? 1,
          firstSeenAt: r.firstSeenAt ?? r.createdAt,
          lastSeenAt: r.lastSeenAt ?? r.createdAt,

          severity: r.severity ? String(r.severity) : undefined,
          opsStatus: String(r.status),
          assignedToAdminId: r.assignedToAdminId ?? null,
          slaDueAt: r.slaDueAt ?? null,
          slaBreachedAt: r.slaBreachedAt ?? null,
        };

        if (!includePayload) return base;

        try {
          const parsed = r.payloadJson ? JSON.parse(String(r.payloadJson)) : null;
          return { ...base, payload: parsed ?? { raw: r.payloadJson } };
        } catch {
          return { ...base, payload: { raw: r.payloadJson } };
        }
      })
      .filter(Boolean);

    const nextCursor =
      rows.length > 0
        ? doGroup
          ? rows[rows.length - 1].fingerprint
          : rows[rows.length - 1].id
        : null;

    return ok({
      since,
      limit: take,
      count: anomalies.length,
      anomalies,
      types: allowed,
      filters: {
        bookingId: bookingId ?? undefined,
        status: status ?? undefined,
        foId: foId ?? undefined,
        type: type ?? undefined,
        opsStatus: opsStatus ?? undefined,
        severity: severity ?? undefined,
        assignedToAdminId: assignedToAdminId ?? undefined,
        mine: mine ? 1 : 0,
        includeUnassigned: includeUnassigned ? 1 : 0,
        unassigned: unassigned ? 1 : 0,
        sla: sla ?? undefined,
        slaWindowMin: sla === "dueSoon" ? slaWindowMin : undefined,
        groupBy: groupBy ?? undefined,
      },
      page: {
        sort,
        sortBy,
        cursor: cursor ?? undefined,
        nextCursor: nextCursor ?? undefined,
        includePayload,
        acked: includeAcked ? 1 : 0,
        mine: mine ? 1 : 0,
        includeUnassigned: includeUnassigned ? 1 : 0,
        unassigned: unassigned ? 1 : 0,
        sla: sla ?? undefined,
        slaWindowMin: sla === "dueSoon" ? slaWindowMin : undefined,
        groupBy: groupBy ?? undefined,
      },
    });
  }

  @Get("anomalies/audit")
  async auditByFingerprint(
    @Req() req: AuthedRequest,
    @Query("fingerprint") fingerprintRaw?: string,
    @Query("eventId") eventIdRaw?: string,
    @Query("sourceEventId") sourceEventIdRaw?: string,
    @Query("limit") limitRaw?: string,
  ) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const fingerprint = fingerprintRaw ? String(fingerprintRaw).trim() : "";
    const eventId = eventIdRaw ? String(eventIdRaw).trim() : "";
    const sourceEventId = sourceEventIdRaw ? String(sourceEventIdRaw).trim() : "";

    if (!fingerprint && !sourceEventId && !eventId) {
      return fail("INVALID_REQUEST", "provide at least one of: fingerprint, sourceEventId, eventId");
    }

    const limit = limitRaw ? Number(limitRaw) : 100;
    if (!Number.isFinite(limit) || limit <= 0 || limit > 500) {
      return fail("INVALID_REQUEST", "limit must be between 1 and 500");
    }

    const where =
      sourceEventId
        ? { sourceEventId }
        : eventId
          ? { eventId }
          : { fingerprint };

    const items = await this.db.opsAlertAudit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return ok({
      fingerprint: fingerprint || null,
      sourceEventId: sourceEventId || null,
      eventId: eventId || null,
      items,
    });
  }

  @Get("anomalies/counts")
  async counts(
    @Req() req: AuthedRequest,
    @Query("sinceHours") sinceHoursRaw?: string,

    @Query("bookingId") bookingIdRaw?: string,
    @Query("status") statusRaw?: string, // booking status
    @Query("foId") foIdRaw?: string,
    @Query("type") typeRaw?: string,

    @Query("opsStatus") opsStatusRaw?: string, // open|acked
    @Query("severity") severityRaw?: string, // info|warning|critical

    // work-queue filters (parity with list)
    @Query("assignedToAdminId") assignedToAdminIdRaw?: string,
    @Query("mine") mineRaw?: string, // 0|1
    @Query("includeUnassigned") includeUnassignedRaw?: string, // 0|1
    @Query("unassigned") unassignedRaw?: string, // 0|1
    @Query("sla") slaRaw?: string, // dueSoon|overdue|breached
    @Query("slaWindowMin") slaWindowMinRaw?: string, // only for dueSoon
    @Query("groupBy") groupByRaw?: string, // fingerprint => rollup-backed
  ) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const sinceHours = sinceHoursRaw ? Number(sinceHoursRaw) : 168; // default 7 days
    if (!Number.isFinite(sinceHours) || sinceHours <= 0) {
      return fail("INVALID_REQUEST", "sinceHours must be a positive number");
    }

    const bookingId = bookingIdRaw ? String(bookingIdRaw).trim() : null;
    const status = statusRaw ? String(statusRaw).trim() : null;
    const foId = foIdRaw ? String(foIdRaw).trim() : null;

    const opsStatus = opsStatusRaw ? String(opsStatusRaw).trim() : null;
    const severity = severityRaw ? String(severityRaw).trim() : null;

    const groupBy = groupByRaw ? String(groupByRaw).trim() : null;
    if (groupBy !== null && groupBy !== "fingerprint") {
      return fail("INVALID_REQUEST", "groupBy must be: fingerprint");
    }

    const mine = mineRaw ? String(mineRaw).trim() === "1" : false;
    const includeUnassigned = includeUnassignedRaw
      ? String(includeUnassignedRaw).trim() === "1"
      : false;
    const unassigned = unassignedRaw ? String(unassignedRaw).trim() === "1" : false;

    const sla = slaRaw ? String(slaRaw).trim() : null;
    const allowedSla = ["dueSoon", "overdue", "breached"] as const;
    if (sla !== null && !allowedSla.includes(sla as any)) {
      return fail("INVALID_REQUEST", `sla must be one of: ${allowedSla.join(", ")}`);
    }

    const slaWindowMin =
      slaWindowMinRaw !== undefined ? Number(slaWindowMinRaw) : 30;

    if (sla === "dueSoon") {
      if (!Number.isFinite(slaWindowMin) || slaWindowMin <= 0 || slaWindowMin > 24 * 60) {
        return fail("INVALID_REQUEST", "slaWindowMin must be between 1 and 1440 minutes");
      }
    }

    if (status !== null) {
      const allowedStatuses = Object.values(BookingStatus);
      if (!allowedStatuses.includes(status as BookingStatus)) {
        return fail("INVALID_REQUEST", `status must be one of: ${allowedStatuses.join(", ")}`);
      }
    }

    if (opsStatus !== null) {
      const allowedOpsStatuses = Object.values(OpsAlertStatus);
      if (!allowedOpsStatuses.includes(opsStatus as OpsAlertStatus)) {
        return fail("INVALID_REQUEST", `opsStatus must be one of: ${allowedOpsStatuses.join(", ")}`);
      }
    }

    if (severity !== null) {
      const allowedSeverities = Object.values(OpsAlertSeverity);
      if (!allowedSeverities.includes(severity as OpsAlertSeverity)) {
        return fail("INVALID_REQUEST", `severity must be one of: ${allowedSeverities.join(", ")}`);
      }
    }

    const allowed: AnomalyType[] = [
      "INTEGRITY_REFUND_WEBHOOK_MISSING",
      "INTEGRITY_DISPUTE_STALE",
      "INTEGRITY_BILLING_SESSION_STALE",
    ];

    const type = typeRaw ? (String(typeRaw).trim() as AnomalyType) : null;
    if (type && !allowed.includes(type)) {
      return fail("INVALID_REQUEST", `type must be one of: ${allowed.join(", ")}`);
    }

    const assignedToAdminId = assignedToAdminIdRaw
      ? String(assignedToAdminIdRaw).trim()
      : null;

    if (assignedToAdminId !== null && assignedToAdminId.length === 0) {
      return fail("INVALID_REQUEST", "assignedToAdminId must be a non-empty string");
    }

    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

    const now = new Date();
    const dueSoonUntil = new Date(now.getTime() + slaWindowMin * 60 * 1000);

    // Base where (counts window uses lastSeenAt)
    const baseWhere: any = {
      lastSeenAt: { gte: since },
      ...(bookingId ? { bookingId } : {}),
      ...(foId ? { foId } : {}),
      ...(status ? { bookingStatus: status as any } : {}),
      ...(type ? { anomalyType: type as any } : {}),
      ...(opsStatus ? { status: opsStatus as any } : {}),
      ...(severity ? { severity: severity as any } : {}),
      ...(sla === "dueSoon"
        ? {
            slaDueAt: { not: null, gte: now, lt: dueSoonUntil },
            slaBreachedAt: null,
          }
        : sla === "overdue"
          ? {
              slaDueAt: { not: null, lt: now },
              slaBreachedAt: null,
            }
          : sla === "breached"
            ? { slaBreachedAt: { not: null } }
            : {}),
    };

    // ownership filters (parity with list)
    if (assignedToAdminId) {
      baseWhere.assignedToAdminId = assignedToAdminId;
    } else if (unassigned) {
      baseWhere.assignedToAdminId = null;
    } else if (mine) {
      baseWhere.OR = [
        { assignedToAdminId: req.user?.userId ?? "__none__" },
        ...(includeUnassigned ? [{ assignedToAdminId: null }] : []),
      ];
    }

    for (const k of Object.keys(baseWhere)) {
      if (baseWhere[k] === undefined) delete baseWhere[k];
    }

    const useRollup = groupBy === "fingerprint";
    const model: "opsAlert" | "opsAlertRollup" = useRollup ? "opsAlertRollup" : "opsAlert";

    // grouped counts by status+severity+type
    const grouped = await (this.db as any)[model].groupBy({
      by: ["status", "severity", "anomalyType"],
      where: baseWhere,
      _count: { _all: true },
    });

    const totalsByStatus: Record<string, number> = {};
    const totalsBySeverity: Record<string, number> = {};
    const totalsByType: Record<string, number> = {};

    for (const g of grouped) {
      const st = String(g.status);
      const sev = String(g.severity);
      const t = String(g.anomalyType);
      const c = Number(g._count?._all ?? 0);

      totalsByStatus[st] = (totalsByStatus[st] ?? 0) + c;
      totalsBySeverity[sev] = (totalsBySeverity[sev] ?? 0) + c;
      totalsByType[t] = (totalsByType[t] ?? 0) + c;
    }

    const userId = req.user?.userId ?? "__none__";

    const AND = (...clauses: any[]) => ({ AND: clauses });

    // NOTE: workQueue metrics must be computed as AND(baseWhere, metricConstraint)
    // so that ownership filters (unassigned/mine/assignedToAdminId/includeUnassigned)
    // do NOT get overridden by the metric.
    const nowDate = now;
    const openTotal = await (this.db as any)[model].count({
      where: AND(baseWhere, { status: "open" }),
    });

    const assignedToMeOpen = await (this.db as any)[model].count({
      where: AND(baseWhere, { status: "open", assignedToAdminId: userId }),
    });

    const unassignedOpen = await (this.db as any)[model].count({
      where: AND(baseWhere, { status: "open", assignedToAdminId: null }),
    });

    const overdueOpen = await (this.db as any)[model].count({
      where: AND(baseWhere, {
        status: "open",
        slaDueAt: { lt: nowDate },
        slaBreachedAt: null,
      }),
    });

    const overdueAssignedToMeOpen = await (this.db as any)[model].count({
      where: AND(baseWhere, {
        status: "open",
        assignedToAdminId: userId,
        slaDueAt: { lt: nowDate },
        slaBreachedAt: null,
      }),
    });

    const unassignedOverdueOpen = await (this.db as any)[model].count({
      where: AND(baseWhere, {
        status: "open",
        assignedToAdminId: null,
        slaDueAt: { lt: nowDate },
        slaBreachedAt: null,
      }),
    });

    const breachedOpen = await (this.db as any)[model].count({
      where: AND(baseWhere, {
        status: "open",
        slaBreachedAt: { not: null },
      }),
    });

    const breachedAssignedToMeOpen = await (this.db as any)[model].count({
      where: AND(baseWhere, {
        status: "open",
        assignedToAdminId: userId,
        slaBreachedAt: { not: null },
      }),
    });

    const unassignedBreachedOpen = await (this.db as any)[model].count({
      where: AND(baseWhere, {
        status: "open",
        assignedToAdminId: null,
        slaBreachedAt: { not: null },
      }),
    });

    const dueSoonOpen = await (this.db as any)[model].count({
      where: AND(baseWhere, {
        status: "open",
        slaDueAt: { not: null, gte: nowDate, lt: dueSoonUntil },
        slaBreachedAt: null,
      }),
    });

    const dueSoonAssignedToMeOpen = await (this.db as any)[model].count({
      where: AND(baseWhere, {
        status: "open",
        assignedToAdminId: userId,
        slaDueAt: { not: null, gte: nowDate, lt: dueSoonUntil },
        slaBreachedAt: null,
      }),
    });

    const dueSoonUnassignedOpen = await (this.db as any)[model].count({
      where: AND(baseWhere, {
        status: "open",
        assignedToAdminId: null,
        slaDueAt: { not: null, gte: nowDate, lt: dueSoonUntil },
        slaBreachedAt: null,
      }),
    });

    const workQueueAll = {
      openTotal,
      assignedToMeOpen,
      overdueOpen,
      overdueAssignedToMeOpen,
      breachedOpen,
      breachedAssignedToMeOpen,
      unassignedOpen,
      unassignedOverdueOpen,
      unassignedBreachedOpen,
      dueSoonOpen,
      dueSoonAssignedToMeOpen,
      dueSoonUnassignedOpen,
    };

    // Shape workQueue keys by SLA mode (so clients don't see irrelevant buckets).
    const workQueueForResponse =
      sla === "dueSoon"
        ? {
            openTotal,
            assignedToMeOpen,
            unassignedOpen,
            dueSoonOpen,
            dueSoonAssignedToMeOpen,
            dueSoonUnassignedOpen,
          }
        : sla === "overdue"
          ? {
              openTotal,
              assignedToMeOpen,
              unassignedOpen,
              overdueOpen,
              overdueAssignedToMeOpen,
              unassignedOverdueOpen,
            }
          : sla === "breached"
            ? {
                openTotal,
                assignedToMeOpen,
                unassignedOpen,
                breachedOpen,
                breachedAssignedToMeOpen,
                unassignedBreachedOpen,
              }
            : workQueueAll;

    return ok({
      since,
      windowField: "lastSeenAt",
      mode: useRollup ? "rollup" : "evidence",
      ...(useRollup ? { groupBy: "fingerprint" } : {}),
      types: allowed,
      filters: {
        bookingId: bookingId ?? undefined,
        status: status ?? undefined,
        foId: foId ?? undefined,
        type: type ?? undefined,
        opsStatus: opsStatus ?? undefined,
        severity: severity ?? undefined,
        assignedToAdminId: assignedToAdminId ?? undefined,
        mine: mine ? 1 : 0,
        includeUnassigned: includeUnassigned ? 1 : 0,
        unassigned: unassigned ? 1 : 0,
        sla: sla ?? undefined,
        slaWindowMin: sla === "dueSoon" ? slaWindowMin : undefined,
        groupBy: groupBy ?? undefined,
      },
      totalsByStatus,
      totalsBySeverity,
      totalsByType,
      workQueue: workQueueForResponse,
    });
  }

  @Get("oncall")
  async getOnCall(@Req() req: AuthedRequest) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const row = await this.db.systemSetting.findUnique({
      where: { key: "OPS_ONCALL_ADMIN_ID" },
    });

    const adminId = row?.value ? String(row.value) : null;

    const admin =
      adminId
        ? await this.db.user.findUnique({
            where: { id: adminId },
            select: { id: true, email: true, phone: true, role: true },
          })
        : null;

    return ok({
      key: "OPS_ONCALL_ADMIN_ID",
      adminId,
      admin,
    });
  }

  @HttpCode(200)
  @Post("oncall")
  async setOnCall(
    @Req() req: AuthedRequest,
    @Body() body: { adminId?: string },
  ) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const adminId = body?.adminId ? String(body.adminId).trim() : "";
    if (!adminId) return fail("INVALID_REQUEST", "adminId is required");

    const admin = await this.db.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    });

    if (!admin) return fail("NOT_FOUND", "admin user not found");
    if (admin.role !== "admin") return fail("INVALID_REQUEST", "user must be an admin");

    await this.db.systemSetting.upsert({
      where: { key: "OPS_ONCALL_ADMIN_ID" },
      create: { key: "OPS_ONCALL_ADMIN_ID", value: adminId },
      update: { value: adminId },
    });

    return ok({
      key: "OPS_ONCALL_ADMIN_ID",
      adminId,
    });
  }

  @HttpCode(200)
  @Post("anomalies/ack")
  async ack(@Req() req: AuthedRequest, @Body() body: AckBody) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const eventId = body?.eventId ? String(body.eventId).trim() : "";
    const fingerprint = body?.fingerprint ? String(body.fingerprint).trim() : "";
    const ackNote = body?.note ? String(body.note).trim() : null;

    if (!eventId && !fingerprint) {
      return fail("INVALID_REQUEST", "eventId or fingerprint is required");
    }
    if (ackNote !== null && ackNote.length > 500) {
      return fail("INVALID_REQUEST", "note must be <= 500 characters");
    }

    try {
      return await this.ackInternal(req, eventId || null, fingerprint || null, ackNote);
    } catch (e: any) {
      if (e?.message === "NOT_FOUND") return fail("NOT_FOUND", "Not found");
      throw e;
    }
  }

  @HttpCode(200)
  @Post("anomalies/ack/bulk")
  async bulkAck(@Req() req: AuthedRequest, @Body() body: BulkAckBody) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const eventIds = Array.isArray(body?.eventIds)
      ? body.eventIds.map((id) => String(id).trim()).filter(Boolean)
      : [];

    const ackNote = body?.note ? String(body.note).trim() : null;

    if (eventIds.length === 0) {
      return fail("INVALID_REQUEST", "eventIds must be a non-empty array");
    }
    if (ackNote !== null && ackNote.length > 500) {
      return fail("INVALID_REQUEST", "note must be <= 500 characters");
    }

    return this.bulkAckInternal(req, eventIds, ackNote);
  }

  @HttpCode(200)
  @Post("anomalies/ack/query")
  async ackQuery(@Req() req: AuthedRequest, @Body() body: AckQueryBody) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const sinceHours = body?.sinceHours !== undefined ? Number(body.sinceHours) : 168;
    const limit = body?.limit !== undefined ? Number(body.limit) : 200;

    if (!Number.isFinite(sinceHours) || sinceHours <= 0) {
      return fail("INVALID_REQUEST", "sinceHours must be a positive number");
    }
    if (!Number.isFinite(limit) || limit <= 0 || limit > 200) {
      return fail("INVALID_REQUEST", "limit must be between 1 and 200");
    }

    const bookingId = body?.bookingId ? String(body.bookingId).trim() : null;
    const status = body?.status ? String(body.status).trim() : null;
    const foId = body?.foId ? String(body.foId).trim() : null;

    const opsStatus = body?.opsStatus ? String(body.opsStatus).trim() : null;
    const severity = body?.severity ? String(body.severity).trim() : null;

    if (status !== null) {
      const allowedStatuses = Object.values(BookingStatus);
      if (!allowedStatuses.includes(status as BookingStatus)) {
        return fail(
          "INVALID_REQUEST",
          `status must be one of: ${allowedStatuses.join(", ")}`,
        );
      }
    }

    if (opsStatus !== null) {
      const allowedOpsStatuses = Object.values(OpsAlertStatus);
      if (!allowedOpsStatuses.includes(opsStatus as OpsAlertStatus)) {
        return fail(
          "INVALID_REQUEST",
          `opsStatus must be one of: ${allowedOpsStatuses.join(", ")}`,
        );
      }
    }

    if (severity !== null) {
      const allowedSeverities = Object.values(OpsAlertSeverity);
      if (!allowedSeverities.includes(severity as OpsAlertSeverity)) {
        return fail(
          "INVALID_REQUEST",
          `severity must be one of: ${allowedSeverities.join(", ")}`,
        );
      }
    }

    if (bookingId !== null && bookingId.length === 0) {
      return fail("INVALID_REQUEST", "bookingId must be a non-empty string");
    }
    if (status !== null && status.length === 0) {
      return fail("INVALID_REQUEST", "status must be a non-empty string");
    }
    if (foId !== null && foId.length === 0) {
      return fail("INVALID_REQUEST", "foId must be a non-empty string");
    }
    if (opsStatus !== null && opsStatus.length === 0) {
      return fail("INVALID_REQUEST", "opsStatus must be a non-empty string");
    }
    if (severity !== null && severity.length === 0) {
      return fail("INVALID_REQUEST", "severity must be a non-empty string");
    }

    const ackNote = body?.note ? String(body.note).trim() : null;
    if (ackNote !== null && ackNote.length > 500) {
      return fail("INVALID_REQUEST", "note must be <= 500 characters");
    }

    const allowed: AnomalyType[] = [
      "INTEGRITY_REFUND_WEBHOOK_MISSING",
      "INTEGRITY_DISPUTE_STALE",
      "INTEGRITY_BILLING_SESSION_STALE",
    ];

    const typeRaw = body?.type ? String(body.type).trim() : null;
    const type = typeRaw ? (typeRaw as AnomalyType) : null;
    if (type && !allowed.includes(type)) {
      return fail(
        "INVALID_REQUEST",
        `type must be one of: ${allowed.join(", ")}`,
      );
    }

    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

    const groupByRaw = body?.groupBy ? String(body.groupBy).trim() : null;
    const groupBy = groupByRaw === "fingerprint" ? "fingerprint" : null;

    // Rollup mode: operate on OpsAlertRollup (fingerprint queue)
    if (groupBy === "fingerprint") {
      const rollupWhere: any = {
        firstSeenAt: { gte: since },
        ...(opsStatus ? { status: opsStatus as any } : { status: "open" }),
        ...(bookingId ? { bookingId } : {}),
        ...(status ? { bookingStatus: status as any } : {}),
        ...(foId ? { foId } : {}),
        ...(type ? { anomalyType: type as any } : {}),
        ...(severity ? { severity: severity as any } : {}),
      };

      const rollups = await this.db.opsAlertRollup.findMany({
        where: rollupWhere,
        orderBy: { lastSeenAt: "desc" },
        take: Math.floor(limit),
        select: { fingerprint: true },
      });

      const fingerprints = rollups
        .map((r: { fingerprint: string | null }) => r.fingerprint)
        .filter((f): f is string => Boolean(f));
      const matched = fingerprints.length;

      const bulkRes = matched
        ? await this.bulkAckInternal(req, [], ackNote, fingerprints)
        : ok({ requested: 0, acked: 0, alreadyAcked: 0, failed: [] });

      return ok({
        since,
        matched,
        attempted: matched,
        ...(bulkRes as any).data,
      });
    }

    const alertWhere: any = {
      createdAt: { gte: since },

      // default behavior: ackQuery targets OPEN alerts only
      ...(opsStatus ? { status: opsStatus as any } : { status: "open" }),

      ...(severity ? { severity: severity as any } : {}),
      ...(bookingId ? { bookingId } : {}),
      ...(status ? { bookingStatus: status as any } : {}),
      ...(foId ? { foId } : {}),
      ...(type ? { anomalyType: type as any } : {}),
    };

    const rows = await this.db.opsAlert.findMany({
      where: alertWhere,
      orderBy: { createdAt: "desc" },
      take: Math.floor(limit),
      select: { id: true, sourceEventId: true },
    });

    // IMPORTANT: For ack endpoints, accept legacy "eventId" (BookingEvent.id).
    // Our ackInternal can resolve either opsAlert.id or sourceEventId, so we pass
    // sourceEventId when present to preserve old behavior.
    const candidateIds = rows
      .map((r: { id: string; sourceEventId: string | null }) =>
        r.sourceEventId ? String(r.sourceEventId) : String(r.id),
      )
      .filter(Boolean);

    const matched = candidateIds.length;

    const bulkRes = matched
      ? await this.bulkAckInternal(req, candidateIds, ackNote)
      : ok({
          requested: 0,
          acked: 0,
          alreadyAcked: 0,
          failed: [],
        });

    return ok({
      since,
      matched,
      attempted: matched,
      ...(bulkRes as any).data,
    });
  }

  @HttpCode(200)
  @Post("anomalies/resolve")
  async resolve(@Req() req: AuthedRequest, @Body() body: ResolveBody) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const eventId = body?.eventId ? String(body.eventId).trim() : "";
    const fingerprint = body?.fingerprint ? String(body.fingerprint).trim() : "";
    const resolveNote = body?.note ? String(body.note).trim() : null;

    if (!eventId && !fingerprint) {
      return fail("INVALID_REQUEST", "eventId or fingerprint is required");
    }
    if (resolveNote !== null && resolveNote.length > 500) {
      return fail("INVALID_REQUEST", "note must be <= 500 characters");
    }

    try {
      return await this.resolveInternal(req, eventId || null, fingerprint || null, resolveNote);
    } catch (e: any) {
      if (e?.message === "NOT_FOUND") return fail("NOT_FOUND", "Not found");
      throw e;
    }
  }

  @HttpCode(200)
  @Post("anomalies/resolve/bulk")
  async bulkResolve(@Req() req: AuthedRequest, @Body() body: BulkResolveBody) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const eventIds = Array.isArray(body?.eventIds)
      ? body.eventIds.map((id) => String(id).trim()).filter(Boolean)
      : [];

    const resolveNote = body?.note ? String(body.note).trim() : null;

    if (eventIds.length === 0) {
      return fail("INVALID_REQUEST", "eventIds must be a non-empty array");
    }
    if (resolveNote !== null && resolveNote.length > 500) {
      return fail("INVALID_REQUEST", "note must be <= 500 characters");
    }

    return this.bulkResolveInternal(req, eventIds, resolveNote);
  }

  @HttpCode(200)
  @Post("anomalies/resolve/query")
  async resolveQuery(@Req() req: AuthedRequest, @Body() body: ResolveQueryBody) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const sinceHours = body?.sinceHours !== undefined ? Number(body.sinceHours) : 168;
    const limit = body?.limit !== undefined ? Number(body.limit) : 200;

    if (!Number.isFinite(sinceHours) || sinceHours <= 0) {
      return fail("INVALID_REQUEST", "sinceHours must be a positive number");
    }
    if (!Number.isFinite(limit) || limit <= 0 || limit > 200) {
      return fail("INVALID_REQUEST", "limit must be between 1 and 200");
    }

    const bookingId = body?.bookingId ? String(body.bookingId).trim() : null;
    const status = body?.status ? String(body.status).trim() : null;
    const foId = body?.foId ? String(body.foId).trim() : null;

    const opsStatus = body?.opsStatus ? String(body.opsStatus).trim() : null;
    const severity = body?.severity ? String(body.severity).trim() : null;

    if (status !== null) {
      const allowedStatuses = Object.values(BookingStatus);
      if (!allowedStatuses.includes(status as BookingStatus)) {
        return fail(
          "INVALID_REQUEST",
          `status must be one of: ${allowedStatuses.join(", ")}`,
        );
      }
    }

    if (opsStatus !== null) {
      const allowedOpsStatuses = Object.values(OpsAlertStatus);
      if (!allowedOpsStatuses.includes(opsStatus as OpsAlertStatus)) {
        return fail(
          "INVALID_REQUEST",
          `opsStatus must be one of: ${allowedOpsStatuses.join(", ")}`,
        );
      }
    }

    if (severity !== null) {
      const allowedSeverities = Object.values(OpsAlertSeverity);
      if (!allowedSeverities.includes(severity as OpsAlertSeverity)) {
        return fail(
          "INVALID_REQUEST",
          `severity must be one of: ${allowedSeverities.join(", ")}`,
        );
      }
    }

    if (bookingId !== null && bookingId.length === 0) {
      return fail("INVALID_REQUEST", "bookingId must be a non-empty string");
    }
    if (status !== null && status.length === 0) {
      return fail("INVALID_REQUEST", "status must be a non-empty string");
    }
    if (foId !== null && foId.length === 0) {
      return fail("INVALID_REQUEST", "foId must be a non-empty string");
    }
    if (opsStatus !== null && opsStatus.length === 0) {
      return fail("INVALID_REQUEST", "opsStatus must be a non-empty string");
    }
    if (severity !== null && severity.length === 0) {
      return fail("INVALID_REQUEST", "severity must be a non-empty string");
    }

    const resolveNote = body?.note ? String(body.note).trim() : null;
    if (resolveNote !== null && resolveNote.length > 500) {
      return fail("INVALID_REQUEST", "note must be <= 500 characters");
    }

    const allowed: AnomalyType[] = [
      "INTEGRITY_REFUND_WEBHOOK_MISSING",
      "INTEGRITY_DISPUTE_STALE",
      "INTEGRITY_BILLING_SESSION_STALE",
    ];

    const typeRaw = body?.type ? String(body.type).trim() : null;
    const type = typeRaw ? (typeRaw as AnomalyType) : null;
    if (type && !allowed.includes(type)) {
      return fail(
        "INVALID_REQUEST",
        `type must be one of: ${allowed.join(", ")}`,
      );
    }

    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

    const groupByRaw = body?.groupBy ? String(body.groupBy).trim() : null;
    const groupBy = groupByRaw === "fingerprint" ? "fingerprint" : null;

    // Rollup mode: operate on OpsAlertRollup (fingerprint queue)
    if (groupBy === "fingerprint") {
      const rollupWhere: any = {
        firstSeenAt: { gte: since },
        ...(opsStatus ? { status: opsStatus as any } : { status: "open" }),
        ...(bookingId ? { bookingId } : {}),
        ...(status ? { bookingStatus: status as any } : {}),
        ...(foId ? { foId } : {}),
        ...(type ? { anomalyType: type as any } : {}),
        ...(severity ? { severity: severity as any } : {}),
      };

      const rollups = await this.db.opsAlertRollup.findMany({
        where: rollupWhere,
        orderBy: { lastSeenAt: "desc" },
        take: Math.floor(limit),
        select: { fingerprint: true },
      });

      const fingerprints = rollups
        .map((r: { fingerprint: string | null }) => r.fingerprint)
        .filter((f): f is string => Boolean(f));
      const matched = fingerprints.length;

      const bulkRes = matched
        ? await this.bulkResolveInternal(req, [], resolveNote, fingerprints)
        : ok({
            requested: 0,
            resolved: 0,
            alreadyResolved: 0,
            failed: [],
          });

      return ok({
        since,
        matched,
        attempted: matched,
        ...(bulkRes as any).data,
      });
    }

    const alertWhere: any = {
      createdAt: { gte: since },

      // default: only resolve OPEN alerts unless opsStatus overrides
      ...(opsStatus ? { status: opsStatus as any } : { status: "open" }),

      ...(severity ? { severity: severity as any } : {}),
      ...(bookingId ? { bookingId } : {}),
      ...(status ? { bookingStatus: status as any } : {}),
      ...(foId ? { foId } : {}),
      ...(type ? { anomalyType: type as any } : {}),
    };

    const rows = await this.db.opsAlert.findMany({
      where: alertWhere,
      orderBy: { createdAt: "desc" },
      take: Math.floor(limit),
      select: { id: true, sourceEventId: true },
    });

    const candidateIds = rows
      .map((r: { id: string; sourceEventId: string | null }) =>
        r.sourceEventId ? String(r.sourceEventId) : String(r.id),
      )
      .filter(Boolean);

    const matched = candidateIds.length;

    const bulkRes = matched
      ? await this.bulkResolveInternal(req, candidateIds, resolveNote)
      : ok({
          requested: 0,
          resolved: 0,
          alreadyResolved: 0,
          failed: [],
        });

    return ok({
      since,
      matched,
      attempted: matched,
      ...(bulkRes as any).data,
    });
  }

  @HttpCode(200)
  @Post("anomalies/resolve/fingerprint")
  async resolveFingerprint(
    @Req() req: AuthedRequest,
    @Body() body: { fingerprint?: string; note?: string },
  ) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const fingerprint = body?.fingerprint ? String(body.fingerprint).trim() : "";
    const note = body?.note ? String(body.note).trim() : null;

    if (!fingerprint) return fail("INVALID_REQUEST", "fingerprint is required");
    if (note !== null && note.length > 500) {
      return fail("INVALID_REQUEST", "note must be <= 500 characters");
    }

    const now = new Date();

    const updated = await this.db.opsAlert.updateMany({
      where: { fingerprint, status: "open" },
      data: {
        status: "acked",
        resolvedAt: now,
        resolvedByAdminId: req.user?.userId ?? null,
        resolveNote: note ?? null,

        ackedAt: now,
        ackedByAdminId: req.user?.userId ?? null,
        ackNote: note ?? null,
      } as any,
    });

    return ok({
      fingerprint,
      resolved: updated.count,
    });
  }

  @HttpCode(200)
  @Post("anomalies/assign")
  async assign(@Req() req: AuthedRequest, @Body() body: AssignBody) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const eventId = body?.eventId ? String(body.eventId).trim() : "";
    const fingerprint = body?.fingerprint ? String(body.fingerprint).trim() : "";
    if (!eventId && !fingerprint) return fail("INVALID_REQUEST", "eventId or fingerprint is required");

    const raw = body?.adminId ?? body?.assignedToAdminId;
    const adminId = (raw === undefined || raw === null) ? null : (String(raw).trim() || null);

    if (adminId !== null && adminId !== undefined) {
      const assignee = await this.db.user.findUnique({
        where: { id: adminId },
        select: { id: true, role: true },
      });
      if (!assignee) return fail("NOT_FOUND", "adminId user not found");
      if (assignee.role !== "admin") return fail("INVALID_REQUEST", "adminId must be an admin user");
    }

    try {
      const rollup = await this.findTargetRollup({
        eventId: eventId || undefined,
        fingerprint: fingerprint || undefined,
      });
      if (!rollup) throw new Error("NOT_FOUND");

      const assignAdminId = adminId ?? null;

      const before = rollup;

      await this.db.opsAlertRollup.update({
        where: { fingerprint: rollup.fingerprint },
        data: { assignedToAdminId: assignAdminId } as any,
      });

      await this.auditRollupChange({
        fingerprint: rollup.fingerprint,
        ...this.auditMetaFromEventId(eventId),
        action: "assign",
        from: {
          status: String(before.status),
          severity: String(before.severity),
          assignedToAdminId: before.assignedToAdminId ?? null,
        },
        to: {
          status: String(before.status),
          severity: String(before.severity),
          assignedToAdminId: assignAdminId ?? null,
        },
        actorAdminId: req.user?.userId ?? null,
      });

      await this.cascadeRollupStatusToEvidence({
        fingerprint: rollup.fingerprint,
        assignedToAdminId: assignAdminId,
      });

      return ok({ assigned: true, fingerprint: rollup.fingerprint, assignedToAdminId: assignAdminId });
    } catch (e: any) {
      if (e?.message === "NOT_FOUND") return fail("NOT_FOUND", "Not found");
      throw e;
    }
  }

  private async getAckedTargetEventIdsSince(since: Date, bookingIds: string[]) {
    if (bookingIds.length === 0) return new Set<string>();

    const set = new Set<string>();
    const pageSize = 1000;
    let cursor: string | null = null;

    while (true) {
      const ackEvents: { id: string; note: string | null }[] =
        await this.db.bookingEvent.findMany({
        where: {
          type: BookingEventType.NOTE,
          createdAt: { gte: since },
          bookingId: { in: bookingIds },
          note: { contains: `"type":"${ACK_TYPE}"` },
        },
        orderBy: { createdAt: "desc" },
        take: pageSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      for (const ae of ackEvents) {
        try {
          const parsed = ae.note ? JSON.parse(ae.note) : null;
          const target = parsed?.targetEventId
            ? String(parsed.targetEventId)
            : null;
          if (target) set.add(target);
        } catch {
          // ignore malformed ack notes
        }
      }

      if (ackEvents.length < pageSize) break;
      cursor = ackEvents[ackEvents.length - 1].id;
    }

    return set;
  }

  private async bulkAckInternal(
    req: AuthedRequest,
    eventIds: string[],
    ackNote: string | null,
    fingerprints?: string[],
  ) {
    let acked = 0;
    let alreadyAcked = 0;
    const failed: string[] = [];

    if (fingerprints && fingerprints.length > 0) {
      for (const fp of fingerprints) {
        try {
          const res = await this.ackInternal(req, null, fp, ackNote);
          const data = res?.data as { acked?: boolean; alreadyAcked?: boolean } | undefined;
          if (data?.alreadyAcked) alreadyAcked++;
          else if (data?.acked) acked++;
        } catch {
          failed.push(fp);
        }
      }

      return ok({
        requested: fingerprints.length,
        acked,
        alreadyAcked,
        failed,
      });
    }

    for (const eventId of eventIds) {
      try {
        const res = await this.ackInternal(req, eventId, null, ackNote);
        const data = res?.data as { acked?: boolean; alreadyAcked?: boolean } | undefined;
        if (data?.alreadyAcked) alreadyAcked++;
        else if (data?.acked) acked++;
      } catch {
        failed.push(eventId);
      }
    }

    return ok({
      requested: eventIds.length,
      acked,
      alreadyAcked,
      failed,
    });
  }

  private async findTargetRollup(params: { eventId?: string; fingerprint?: string }) {
    const { eventId, fingerprint } = params;

    if (fingerprint) {
      const fp = String(fingerprint).trim();
      if (!fp) return null;
      return this.db.opsAlertRollup.findUnique({ where: { fingerprint: fp } });
    }

    if (eventId) {
      const id = String(eventId).trim();
      if (!id) return null;

      const alert = await this.db.opsAlert.findFirst({
        where: { OR: [{ id }, { sourceEventId: id }] },
      });
      if (!alert?.fingerprint) return null;

      return this.db.opsAlertRollup.findUnique({
        where: { fingerprint: alert.fingerprint },
      });
    }

    return null;
  }

  private auditMetaFromEventId(eventId?: string | null) {
    return eventId ? { eventId, sourceEventId: eventId } : {};
  }

  private async auditRollupChange(args: {
    fingerprint: string;
    eventId?: string | null;
    sourceEventId?: string | null;
    action: string; // e.g. "assign" | "ack" | "resolve"
    from?: {
      status?: string | null;
      severity?: string | null;
      assignedToAdminId?: string | null;
    };
    to?: {
      status?: string | null;
      severity?: string | null;
      assignedToAdminId?: string | null;
    };
    actorAdminId: string | null;
  }) {
    const { fingerprint, eventId, sourceEventId, action, from, to, actorAdminId } = args;

    await this.db.opsAlertAudit.create({
      data: {
        fingerprint,
        eventId: eventId ?? null,
        sourceEventId: sourceEventId ?? null,
        action,

        fromStatus: from?.status ?? null,
        toStatus: to?.status ?? null,

        fromSeverity: from?.severity ?? null,
        toSeverity: to?.severity ?? null,

        fromAssignedToAdminId: from?.assignedToAdminId ?? null,
        toAssignedToAdminId: to?.assignedToAdminId ?? null,

        actorAdminId: actorAdminId ?? null,
      } as any,
    });
  }

  private async cascadeRollupStatusToEvidence(params: {
    fingerprint: string;
    status?: "open" | "acked";
    ack?: { byAdminId: string | null; note: string | null };
    resolve?: { byAdminId: string | null; note: string | null };
    assignedToAdminId?: string | null;
  }) {
    const { fingerprint, status, ack, resolve, assignedToAdminId } = params;

    const data: any = {
      ...(status ? { status } : {}),
      ...(assignedToAdminId !== undefined ? { assignedToAdminId } : {}),
    };

    if (ack) {
      data.ackedAt = new Date();
      data.ackedByAdminId = ack.byAdminId ?? null;
      data.ackNote = ack.note ?? null;
    }

    if (resolve) {
      data.resolvedAt = new Date();
      data.resolvedByAdminId = resolve.byAdminId ?? null;
      data.resolveNote = resolve.note ?? null;
    }

    await this.db.opsAlert.updateMany({
      where: { fingerprint, status: "open" },
      data,
    });
  }

  private async ackInternal(
    req: AuthedRequest,
    eventId: string | null,
    fingerprint: string | null,
    ackNote: string | null,
  ) {
    if (fingerprint) {
      const rollup = await this.db.opsAlertRollup.findUnique({
        where: { fingerprint },
      });
      if (!rollup) throw new Error("NOT_FOUND");

      if (rollup.status === "acked") {
        return ok({ acked: true, alreadyAcked: true, eventId: eventId ?? null, fingerprint });
      }

      const before = rollup;

      await this.db.opsAlertRollup.update({
        where: { fingerprint },
        data: {
          status: "acked",
          ackedAt: new Date(),
          ackedByAdminId: req.user?.userId ?? null,
          ackNote: ackNote ?? null,
        } as any,
      });

      await this.auditRollupChange({
        fingerprint,
        ...this.auditMetaFromEventId(eventId),
        action: "ack",
        from: {
          status: String(before.status),
          severity: String(before.severity),
          assignedToAdminId: before.assignedToAdminId ?? null,
        },
        to: {
          status: "acked",
          severity: String(before.severity),
          assignedToAdminId: before.assignedToAdminId ?? null,
        },
        actorAdminId: req.user?.userId ?? null,
      });

      await this.cascadeRollupStatusToEvidence({
        fingerprint,
        status: "acked",
        ack: { byAdminId: req.user?.userId ?? null, note: ackNote ?? null },
      });

      return ok({ acked: true, eventId: eventId ?? null, fingerprint });
    }

    if (!eventId) throw new Error("NOT_FOUND");

    const rollup = await this.findTargetRollup({
      eventId,
      fingerprint: undefined,
    });

    if (!rollup) throw new Error("NOT_FOUND");

    if (rollup.status === "acked") {
      return ok({ acked: true, alreadyAcked: true, eventId, fingerprint: rollup.fingerprint });
    }

    const before = rollup;

    await this.db.opsAlertRollup.update({
      where: { fingerprint: rollup.fingerprint },
      data: {
        status: "acked",
        ackedAt: new Date(),
        ackedByAdminId: req.user?.userId ?? null,
        ackNote: ackNote ?? null,
      } as any,
    });

    await this.auditRollupChange({
      fingerprint: rollup.fingerprint,
      ...this.auditMetaFromEventId(eventId),
      action: "ack",
      from: {
        status: String(before.status),
        severity: String(before.severity),
        assignedToAdminId: before.assignedToAdminId ?? null,
      },
      to: {
        status: "acked",
        severity: String(before.severity),
        assignedToAdminId: before.assignedToAdminId ?? null,
      },
      actorAdminId: req.user?.userId ?? null,
    });

    await this.cascadeRollupStatusToEvidence({
      fingerprint: rollup.fingerprint,
      status: "acked",
      ack: { byAdminId: req.user?.userId ?? null, note: ackNote ?? null },
    });

    return ok({ acked: true, eventId, fingerprint: rollup.fingerprint });
  }

  private async bulkResolveInternal(
    req: AuthedRequest,
    eventIds: string[],
    resolveNote: string | null,
    fingerprints?: string[],
  ) {
    let resolved = 0;
    let alreadyResolved = 0;
    const failed: string[] = [];

    if (fingerprints && fingerprints.length > 0) {
      for (const fp of fingerprints) {
        try {
          const res = await this.resolveInternal(req, null, fp, resolveNote);
          const data = res?.data as { resolved?: boolean; alreadyResolved?: boolean } | undefined;
          if (data?.alreadyResolved) alreadyResolved++;
          else if (data?.resolved) resolved++;
        } catch {
          failed.push(fp);
        }
      }

      return ok({
        requested: fingerprints.length,
        resolved,
        alreadyResolved,
        failed,
      });
    }

    for (const eventId of eventIds) {
      try {
        const res = await this.resolveInternal(req, eventId, null, resolveNote);
        const data = res?.data as { resolved?: boolean; alreadyResolved?: boolean } | undefined;
        if (data?.alreadyResolved) alreadyResolved++;
        else if (data?.resolved) resolved++;
      } catch {
        failed.push(eventId);
      }
    }

    return ok({
      requested: eventIds.length,
      resolved,
      alreadyResolved,
      failed,
    });
  }

  private async resolveInternal(
    req: AuthedRequest,
    eventId: string | null,
    fingerprint: string | null,
    resolveNote: string | null,
  ) {
    const actorAdminId = req.user?.userId ?? null;

    if (fingerprint) {
      const rollup = await this.db.opsAlertRollup.findUnique({
        where: { fingerprint },
      });
      if (!rollup) throw new Error("NOT_FOUND");

      // ✅ Early return: do NOT audit no-op (mirrors ack/assign patterns)
      if (rollup.resolvedAt) {
        // Only write an audit row when we have an evidence id (eventId)
        if (eventId) {
          await this.auditRollupChange({
            fingerprint: rollup.fingerprint,
            ...this.auditMetaFromEventId(eventId),
            action: "resolve",
            from: {
              status: String(rollup.status),
              severity: String(rollup.severity),
              assignedToAdminId: rollup.assignedToAdminId ?? null,
            },
            to: {
              status: String(rollup.status),
              severity: String(rollup.severity),
              assignedToAdminId: rollup.assignedToAdminId ?? null,
            },
            actorAdminId,
          });
        }

        return ok({ resolved: true, alreadyResolved: true, eventId: eventId ?? null, fingerprint });
      }

      const before = rollup;

      const after = await this.db.opsAlertRollup.update({
        where: { fingerprint },
        data: {
          resolvedAt: new Date(),
          resolvedByAdminId: actorAdminId,
          resolveNote: resolveNote ?? null,

          status: "acked",

          ...(rollup.ackedAt
            ? {}
            : {
                ackedAt: new Date(),
                ackedByAdminId: actorAdminId,
                ackNote: resolveNote ?? null,
              }),
        } as any,
      });

      // ✅ AUDIT: resolve (fingerprint path)
      await this.auditRollupChange({
        fingerprint: after.fingerprint,
        ...this.auditMetaFromEventId(eventId),
        action: "resolve",
        from: {
          status: String(before.status),
          severity: String(before.severity),
          assignedToAdminId: before.assignedToAdminId ?? null,
        },
        to: {
          status: String(after.status),
          severity: String(after.severity),
          assignedToAdminId: after.assignedToAdminId ?? null,
        },
        actorAdminId,
      });

      await this.cascadeRollupStatusToEvidence({
        fingerprint,
        status: "acked",
        ack: { byAdminId: actorAdminId, note: resolveNote ?? null },
        resolve: { byAdminId: actorAdminId, note: resolveNote ?? null },
      });

      return ok({ resolved: true, eventId: eventId ?? null, fingerprint });
    }

    if (!eventId) throw new Error("NOT_FOUND");

    const rollup = await this.findTargetRollup({
      eventId,
      fingerprint: undefined,
    });
    if (!rollup) throw new Error("NOT_FOUND");

    if (rollup.resolvedAt) {
      await this.auditRollupChange({
        fingerprint: rollup.fingerprint,
        ...this.auditMetaFromEventId(eventId),
        action: "resolve",
        from: {
          status: String(rollup.status),
          severity: String(rollup.severity),
          assignedToAdminId: rollup.assignedToAdminId ?? null,
        },
        to: {
          status: String(rollup.status),
          severity: String(rollup.severity),
          assignedToAdminId: rollup.assignedToAdminId ?? null,
        },
        actorAdminId,
      });

      return ok({ resolved: true, alreadyResolved: true, eventId, fingerprint: rollup.fingerprint });
    }

    const before = rollup;

    const after = await this.db.opsAlertRollup.update({
      where: { fingerprint: rollup.fingerprint },
      data: {
        resolvedAt: new Date(),
        resolvedByAdminId: actorAdminId,
        resolveNote: resolveNote ?? null,

        status: "acked",

        ...(rollup.ackedAt
          ? {}
          : {
              ackedAt: new Date(),
              ackedByAdminId: actorAdminId,
              ackNote: resolveNote ?? null,
            }),
      } as any,
    });

    // ✅ AUDIT: resolve (eventId path)
    await this.auditRollupChange({
      fingerprint: after.fingerprint,
      ...this.auditMetaFromEventId(eventId),
      action: "resolve",
      from: {
        status: String(before.status),
        severity: String(before.severity),
        assignedToAdminId: before.assignedToAdminId ?? null,
      },
      to: {
        status: String(after.status),
        severity: String(after.severity),
        assignedToAdminId: after.assignedToAdminId ?? null,
      },
      actorAdminId,
    });

    await this.cascadeRollupStatusToEvidence({
      fingerprint: rollup.fingerprint,
      status: "acked",
      ack: { byAdminId: actorAdminId, note: resolveNote ?? null },
      resolve: { byAdminId: actorAdminId, note: resolveNote ?? null },
    });

    return ok({ resolved: true, eventId, fingerprint: rollup.fingerprint });
  }

  @Get("booking-estimate")
  async getBookingEstimate(
    @Req() req: AuthedRequest,
    @Query("bookingId") bookingIdRaw?: string,
  ) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const bookingId = bookingIdRaw ? String(bookingIdRaw).trim() : null;
    if (!bookingId) {
      return fail("INVALID_REQUEST", "bookingId is required");
    }

    const snap = await this.db.bookingEstimateSnapshot.findUnique({
      where: { bookingId },
    });

    if (!snap) {
      return fail("NOT_FOUND", "BookingEstimateSnapshot not found for bookingId");
    }

    let input: any = null;
    let output: any = null;

    try {
      input = snap.inputJson ? JSON.parse(snap.inputJson) : null;
    } catch {
      input = { raw: snap.inputJson };
    }

    try {
      output = snap.outputJson ? JSON.parse(snap.outputJson) : null;
    } catch {
      output = { raw: snap.outputJson };
    }

    return ok({
      bookingId: snap.bookingId,
      createdAt: snap.createdAt,

      estimatorVersion: snap.estimatorVersion,
      mode: snap.mode,
      confidence: snap.confidence,

      riskPercentUncapped: snap.riskPercentUncapped,
      riskPercentCappedForRange: snap.riskPercentCappedForRange,
      riskCapped: snap.riskCapped,

      input,
      output,
    });
  }

  @Get("booking-estimate/ack")
  async ackBookingEstimate(
    @Req() req: AuthedRequest,
    @Query("bookingId") bookingIdRaw?: string,
    @Query("note") noteRaw?: string,
  ) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const bookingId = bookingIdRaw ? String(bookingIdRaw).trim() : null;
    if (!bookingId) {
      return fail("INVALID_REQUEST", "bookingId is required");
    }

    const note = noteRaw ? String(noteRaw).trim() : "";
    if (note.length > 400) {
      return fail("INVALID_REQUEST", "note must be <= 400 chars");
    }

    // Ensure booking exists
    const booking = await this.db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return fail("NOT_FOUND", "Booking not found");

    // Write an auditable ops review event (idempotent by bookingId+note+day)
    const idempotencyKey = `OPS_ESTIMATE_REVIEW:${bookingId}:${new Date().toISOString().slice(0, 10)}:${note}`;

    try {
      await this.db.bookingEvent.create({
        data: {
          bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey,
          note: JSON.stringify({
            type: "OPS_ESTIMATE_REVIEW",
            bookingId,
            reviewedAt: new Date().toISOString(),
            reviewedBy: req.user?.userId ?? null,
            note,
          }),
        } as any,
      });
    } catch (err: any) {
      if (err?.code !== "P2002") throw err;
    }

    return ok({
      bookingId,
      acked: true,
      idempotencyKey,
    });
  }
}
