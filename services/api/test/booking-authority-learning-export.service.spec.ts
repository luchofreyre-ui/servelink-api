import {
  BookingAuthorityMismatchType,
  BookingAuthorityReviewStatus,
} from "@prisma/client";
import { BookingAuthorityLearningExportService } from "../src/modules/authority/booking-authority-learning-export.service";
import type { BookingIntelligenceService } from "../src/modules/authority/booking-intelligence.service";
import type { PrismaService } from "../src/prisma";

describe("BookingAuthorityLearningExportService", () => {
  const toIso = new Date("2026-03-24T12:00:00.000Z");

  it("applies recent-window filter to prisma where", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const prisma = {
      bookingAuthorityResult: { findMany, count },
    } as unknown as PrismaService;

    const intelligence = {
      resolveTags: jest.fn().mockReturnValue({
        surfaces: [],
        problems: [],
        methods: [],
        reasons: [],
      }),
    } as unknown as BookingIntelligenceService;

    const svc = new BookingAuthorityLearningExportService(prisma, intelligence);
    const gte = new Date(toIso.getTime() - 48 * 60 * 60 * 1000);

    await svc.buildLearningActivityDataset({
      updatedAtGte: gte,
      toIso,
      skip: 0,
      take: 25,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { updatedAt: { gte } },
        skip: 0,
        take: 25,
      }),
    );
    expect(count).toHaveBeenCalledWith({ where: { updatedAt: { gte } } });
  });

  it("paginates with skip/take", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(100);
    const prisma = {
      bookingAuthorityResult: { findMany, count },
    } as unknown as PrismaService;

    const intelligence = {
      resolveTags: jest.fn().mockReturnValue({
        surfaces: ["tile"],
        problems: [],
        methods: [],
        reasons: [],
      }),
    } as unknown as BookingIntelligenceService;

    const svc = new BookingAuthorityLearningExportService(prisma, intelligence);

    await svc.buildLearningActivityDataset({
      toIso,
      skip: 10,
      take: 5,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
      }),
    );
  });

  it("maps rows to stable JSON shape including mismatch and override tags", async () => {
    const row = {
      bookingId: "bk_1",
      surfacesJson: JSON.stringify(["s1"]),
      problemsJson: JSON.stringify(["p1"]),
      methodsJson: JSON.stringify(["m1"]),
      reasonsJson: JSON.stringify(["r1"]),
      status: BookingAuthorityReviewStatus.overridden,
      reviewedByUserId: "u1",
      reviewedAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      bookingAuthorityMismatches: [
        {
          mismatchType: BookingAuthorityMismatchType.incorrect_surface,
          notes: "n1",
        },
      ],
      booking: {
        notes: "n",
        estimateSnapshot: null as null,
      },
    };

    const findMany = jest.fn().mockResolvedValue([row]);
    const count = jest.fn().mockResolvedValue(1);
    const prisma = {
      bookingAuthorityResult: { findMany, count },
    } as unknown as PrismaService;

    const intelligence = {
      resolveTags: jest.fn().mockReturnValue({
        surfaces: ["tile"],
        problems: ["grease-buildup"],
        methods: [],
        reasons: [],
      }),
    } as unknown as BookingIntelligenceService;

    const svc = new BookingAuthorityLearningExportService(prisma, intelligence);
    const res = await svc.buildLearningActivityDataset({
      toIso,
      skip: 0,
      take: 50,
    });

    expect(res.kind).toBe("booking_authority_learning_activity");
    expect(res.windowUsed).toBeNull();
    expect(res.total).toBe(1);
    expect(res.offset).toBe(0);
    expect(res.limit).toBe(50);
    expect(res.items).toHaveLength(1);
    const item = res.items[0]!;
    expect(item.bookingId).toBe("bk_1");
    expect(item.status).toBe(BookingAuthorityReviewStatus.overridden);
    expect(item.reviewMetadata.reviewedByUserId).toBe("u1");
    expect(item.reviewMetadata.reviewedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(item.originalTags.surfaces).toEqual(["tile"]);
    expect(item.overrideTags?.surfaces).toEqual(["s1"]);
    expect(item.mismatchType).toBe(BookingAuthorityMismatchType.incorrect_surface);
    expect(item.mismatchNotes).toBe("n1");
    expect(item.updatedAt).toBe("2026-03-01T00:00:00.000Z");
  });

  it("uses persisted tags as originalTags when not overridden", async () => {
    const row = {
      bookingId: "bk_2",
      surfacesJson: JSON.stringify(["tile"]),
      problemsJson: JSON.stringify([]),
      methodsJson: JSON.stringify([]),
      reasonsJson: JSON.stringify([]),
      status: BookingAuthorityReviewStatus.auto,
      reviewedByUserId: null,
      reviewedAt: null,
      updatedAt: new Date("2026-03-02T00:00:00.000Z"),
      bookingAuthorityMismatches: [],
      booking: {
        notes: "",
        estimateSnapshot: null as null,
      },
    };

    const findMany = jest.fn().mockResolvedValue([row]);
    const count = jest.fn().mockResolvedValue(1);
    const prisma = {
      bookingAuthorityResult: { findMany, count },
    } as unknown as PrismaService;

    const intelligence = {
      resolveTags: jest.fn().mockReturnValue({
        surfaces: ["resolver-tile"],
        problems: [],
        methods: [],
        reasons: [],
      }),
    } as unknown as BookingIntelligenceService;

    const svc = new BookingAuthorityLearningExportService(prisma, intelligence);
    const res = await svc.buildLearningActivityDataset({
      toIso,
      skip: 0,
      take: 10,
    });

    expect(res.items[0]!.originalTags.surfaces).toEqual(["tile"]);
    expect(res.items[0]!.overrideTags).toBeNull();
    expect(res.items[0]!.mismatchType).toBeNull();
    expect(intelligence.resolveTags).toHaveBeenCalled();
  });

  it("includes windowUsed when a filter is applied", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const prisma = {
      bookingAuthorityResult: { findMany, count },
    } as unknown as PrismaService;

    const intelligence = {
      resolveTags: jest.fn(),
    } as unknown as BookingIntelligenceService;

    const svc = new BookingAuthorityLearningExportService(prisma, intelligence);
    const gte = new Date("2026-03-20T00:00:00.000Z");
    const res = await svc.buildLearningActivityDataset({
      updatedAtGte: gte,
      toIso,
      skip: 0,
      take: 10,
    });

    expect(res.windowUsed).toEqual({
      fromIso: gte.toISOString(),
      toIso: toIso.toISOString(),
    });
  });
});
