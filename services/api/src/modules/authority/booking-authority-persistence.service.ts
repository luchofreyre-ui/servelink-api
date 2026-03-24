import { Injectable, NotFoundException } from "@nestjs/common";
import {
  BookingAuthorityResult,
  BookingAuthorityReviewStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { parseAuthorityStringArrayJson } from "./booking-authority-json.util";
import type { BookingAuthorityTagResult } from "./booking-intelligence.types";

export interface BookingAuthorityResolutionPayload {
  surfaces: string[];
  problems: string[];
  methods: string[];
  reasons: string[];
  resolutionVersion: number;
}

export interface BookingAuthorityTagOverridePayload {
  surfaces: string[];
  problems: string[];
  methods: string[];
  /** When defined, replaces overrideReasonsJson (JSON array, including `[]`). When undefined, column unchanged. */
  overrideReasons?: string[];
}

function stringArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function sameResolvedAuthority(
  existing: BookingAuthorityResult,
  resolved: BookingAuthorityTagResult,
): boolean {
  return (
    stringArraysEqual(
      parseAuthorityStringArrayJson(existing.surfacesJson),
      resolved.surfaces,
    ) &&
    stringArraysEqual(
      parseAuthorityStringArrayJson(existing.problemsJson),
      resolved.problems,
    ) &&
    stringArraysEqual(
      parseAuthorityStringArrayJson(existing.methodsJson),
      resolved.methods,
    ) &&
    stringArraysEqual(
      parseAuthorityStringArrayJson(existing.reasonsJson),
      resolved.reasons,
    )
  );
}

@Injectable()
export class BookingAuthorityPersistenceService {
  constructor(private readonly db: PrismaService) {}

  /**
   * Persists resolver output when surfaces/problems/methods/reasons differ
   * from the stored row. Skips DB writes when unchanged.
   */
  async persistResolvedAuthorityIfChanged(
    bookingId: string,
    resolved: BookingAuthorityTagResult,
  ): Promise<{ persisted: boolean }> {
    const existing = await this.findLatestByBookingId(bookingId);
    if (existing?.status === BookingAuthorityReviewStatus.overridden) {
      return { persisted: false };
    }
    if (existing && sameResolvedAuthority(existing, resolved)) {
      return { persisted: false };
    }
    const resolutionVersion = existing ? existing.resolutionVersion + 1 : 1;
    await this.upsertLatestAuthorityResult(bookingId, {
      surfaces: resolved.surfaces,
      problems: resolved.problems,
      methods: resolved.methods,
      reasons: resolved.reasons,
      resolutionVersion,
    });
    return { persisted: true };
  }

  async upsertLatestAuthorityResult(
    bookingId: string,
    payload: BookingAuthorityResolutionPayload,
  ): Promise<BookingAuthorityResult> {
    return this.db.bookingAuthorityResult.upsert({
      where: { bookingId },
      create: {
        bookingId,
        surfacesJson: JSON.stringify(payload.surfaces),
        problemsJson: JSON.stringify(payload.problems),
        methodsJson: JSON.stringify(payload.methods),
        reasonsJson: JSON.stringify(payload.reasons),
        resolutionVersion: payload.resolutionVersion,
        status: BookingAuthorityReviewStatus.auto,
      },
      update: {
        surfacesJson: JSON.stringify(payload.surfaces),
        problemsJson: JSON.stringify(payload.problems),
        methodsJson: JSON.stringify(payload.methods),
        reasonsJson: JSON.stringify(payload.reasons),
        resolutionVersion: payload.resolutionVersion,
      },
    });
  }

  async findLatestByBookingId(
    bookingId: string,
  ): Promise<BookingAuthorityResult | null> {
    return this.db.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });
  }

  /**
   * Marks the persisted row as reviewed. Does not change tag JSON fields.
   */
  async markAuthorityResultReviewed(
    bookingId: string,
    reviewedByUserId: string,
  ): Promise<BookingAuthorityResult> {
    const existing = await this.findLatestByBookingId(bookingId);
    if (!existing) {
      throw new NotFoundException("BOOKING_AUTHORITY_RESULT_NOT_FOUND");
    }
    return this.db.bookingAuthorityResult.update({
      where: { bookingId },
      data: {
        status: BookingAuthorityReviewStatus.reviewed,
        reviewedByUserId,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Replaces surfaces/problems/methods from admin input. Never modifies reasonsJson
   * (deterministic resolver trail). Optionally sets overrideReasonsJson for operator rationale.
   */
  async applyAuthorityTagOverride(
    bookingId: string,
    payload: BookingAuthorityTagOverridePayload,
    reviewedByUserId: string,
  ): Promise<BookingAuthorityResult> {
    const existing = await this.findLatestByBookingId(bookingId);
    if (!existing) {
      throw new NotFoundException("BOOKING_AUTHORITY_RESULT_NOT_FOUND");
    }

    const data: Prisma.BookingAuthorityResultUncheckedUpdateInput = {
      surfacesJson: JSON.stringify(payload.surfaces),
      problemsJson: JSON.stringify(payload.problems),
      methodsJson: JSON.stringify(payload.methods),
      status: BookingAuthorityReviewStatus.overridden,
      reviewedByUserId,
      reviewedAt: new Date(),
      resolutionVersion: existing.resolutionVersion + 1,
    };

    if (payload.overrideReasons !== undefined) {
      data.overrideReasonsJson = JSON.stringify(payload.overrideReasons);
    }

    return this.db.bookingAuthorityResult.update({
      where: { bookingId },
      data,
    });
  }

  /**
   * Lists persisted authority rows, newest `updatedAt` first.
   * When `status` is omitted, all statuses are included.
   */
  async listPersisted(params: {
    status?: BookingAuthorityReviewStatus;
    skip: number;
    take: number;
  }): Promise<{ items: BookingAuthorityResult[]; total: number }> {
    const where =
      params.status !== undefined ? { status: params.status } : {};
    const [items, total] = await Promise.all([
      this.db.bookingAuthorityResult.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      this.db.bookingAuthorityResult.count({ where }),
    ]);
    return { items, total };
  }

  async listByStatus(
    status: BookingAuthorityReviewStatus,
    pagination: { skip: number; take: number },
  ): Promise<{ items: BookingAuthorityResult[]; total: number }> {
    return this.listPersisted({
      status,
      skip: pagination.skip,
      take: pagination.take,
    });
  }
}
