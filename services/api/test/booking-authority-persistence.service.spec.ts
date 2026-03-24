import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  BookingAuthorityReviewStatus,
  BookingStatus,
  Role,
} from "@prisma/client";
import * as bcrypt from "bcrypt";

import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";
import { BookingAuthorityPersistenceService } from "../src/modules/authority/booking-authority-persistence.service";
import type { BookingAuthorityTagResult } from "../src/modules/authority/booking-intelligence.types";

jest.setTimeout(20000);

describe("BookingAuthorityPersistenceService", () => {
  let service: BookingAuthorityPersistenceService;
  let prisma: PrismaService;
  const bookingIds: string[] = [];
  const userIds: string[] = [];

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [BookingAuthorityPersistenceService],
    }).compile();

    service = modRef.get(BookingAuthorityPersistenceService);
    prisma = modRef.get(PrismaService);
  });

  afterAll(async () => {
    if (bookingIds.length) {
      await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }
    if (userIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  async function createCustomerAndBooking(): Promise<{
    userId: string;
    bookingId: string;
  }> {
    const passwordHash = await bcrypt.hash("test-password", 4);
    const user = await prisma.user.create({
      data: {
        email: `authority_persist_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
        passwordHash,
        role: Role.customer,
      },
    });
    userIds.push(user.id);

    const booking = await prisma.booking.create({
      data: {
        customerId: user.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        status: BookingStatus.pending_payment,
      },
    });
    bookingIds.push(booking.id);

    return { userId: user.id, bookingId: booking.id };
  }

  it("creates initial row with default status auto", async () => {
    const { bookingId } = await createCustomerAndBooking();

    const row = await service.upsertLatestAuthorityResult(bookingId, {
      surfaces: ["tile"],
      problems: ["grease-buildup"],
      methods: ["degreasing"],
      reasons: ["surface:tile:matched-keyword"],
      resolutionVersion: 1,
    });

    expect(row.bookingId).toBe(bookingId);
    expect(row.status).toBe(BookingAuthorityReviewStatus.auto);
    expect(JSON.parse(row.surfacesJson)).toEqual(["tile"]);
    expect(JSON.parse(row.problemsJson)).toEqual(["grease-buildup"]);
    expect(JSON.parse(row.methodsJson)).toEqual(["degreasing"]);
    expect(JSON.parse(row.reasonsJson)).toEqual([
      "surface:tile:matched-keyword",
    ]);
    expect(row.resolutionVersion).toBe(1);
    expect(row.reviewedByUserId).toBeNull();
    expect(row.reviewedAt).toBeNull();
  });

  it("upserts overwrite for same booking", async () => {
    const { bookingId } = await createCustomerAndBooking();

    await service.upsertLatestAuthorityResult(bookingId, {
      surfaces: ["tile"],
      problems: ["soap-scum"],
      methods: ["hard-water-deposit-removal"],
      reasons: ["a"],
      resolutionVersion: 1,
    });

    const second = await service.upsertLatestAuthorityResult(bookingId, {
      surfaces: ["shower-glass"],
      problems: ["limescale"],
      methods: ["glass-cleaning"],
      reasons: ["b", "c"],
      resolutionVersion: 2,
    });

    const rows = await prisma.bookingAuthorityResult.findMany({
      where: { bookingId },
    });
    expect(rows).toHaveLength(1);
    expect(second.id).toBe(rows[0]!.id);
    expect(JSON.parse(second.surfacesJson)).toEqual(["shower-glass"]);
    expect(second.resolutionVersion).toBe(2);
    expect(second.status).toBe(BookingAuthorityReviewStatus.auto);
  });

  it("fetches by bookingId", async () => {
    const { bookingId } = await createCustomerAndBooking();

    await service.upsertLatestAuthorityResult(bookingId, {
      surfaces: [],
      problems: [],
      methods: [],
      reasons: [],
      resolutionVersion: 3,
    });

    const found = await service.findLatestByBookingId(bookingId);
    expect(found).not.toBeNull();
    expect(found!.bookingId).toBe(bookingId);
    expect(found!.resolutionVersion).toBe(3);
  });

  it("lists by status with pagination", async () => {
    const { bookingId: b1 } = await createCustomerAndBooking();
    const { bookingId: b2 } = await createCustomerAndBooking();

    await service.upsertLatestAuthorityResult(b1, {
      surfaces: ["a"],
      problems: [],
      methods: [],
      reasons: [],
      resolutionVersion: 1,
    });
    await service.upsertLatestAuthorityResult(b2, {
      surfaces: ["b"],
      problems: [],
      methods: [],
      reasons: [],
      resolutionVersion: 1,
    });

    await prisma.bookingAuthorityResult.update({
      where: { bookingId: b2 },
      data: { status: BookingAuthorityReviewStatus.reviewed },
    });

    const autoPage = await service.listByStatus(
      BookingAuthorityReviewStatus.auto,
      { skip: 0, take: 10 },
    );
    expect(autoPage.total).toBeGreaterThanOrEqual(1);
    expect(
      autoPage.items.some((r) => r.bookingId === b1),
    ).toBe(true);
    expect(autoPage.items.some((r) => r.bookingId === b2)).toBe(false);

    const reviewedPage = await service.listByStatus(
      BookingAuthorityReviewStatus.reviewed,
      { skip: 0, take: 10 },
    );
    expect(reviewedPage.items.some((r) => r.bookingId === b2)).toBe(true);
  });

  describe("listPersisted", () => {
    it("returns persisted rows including newly upserted booking", async () => {
      const { bookingId } = await createCustomerAndBooking();
      await service.upsertLatestAuthorityResult(bookingId, {
        surfaces: ["list-smoke-surface"],
        problems: [],
        methods: [],
        reasons: [],
        resolutionVersion: 1,
      });
      const page = await service.listPersisted({
        skip: 0,
        take: 500,
      });
      expect(page.items.some((r) => r.bookingId === bookingId)).toBe(true);
      expect(page.total).toBeGreaterThanOrEqual(1);
    });

    it("filters by status when provided", async () => {
      const { bookingId: autoId } = await createCustomerAndBooking();
      const { bookingId: reviewedId } = await createCustomerAndBooking();
      await service.upsertLatestAuthorityResult(autoId, {
        surfaces: ["x"],
        problems: [],
        methods: [],
        reasons: [],
        resolutionVersion: 1,
      });
      await service.upsertLatestAuthorityResult(reviewedId, {
        surfaces: ["y"],
        problems: [],
        methods: [],
        reasons: [],
        resolutionVersion: 1,
      });
      await prisma.bookingAuthorityResult.update({
        where: { bookingId: reviewedId },
        data: { status: BookingAuthorityReviewStatus.reviewed },
      });
      const autoOnly = await service.listPersisted({
        status: BookingAuthorityReviewStatus.auto,
        skip: 0,
        take: 500,
      });
      expect(autoOnly.items.some((r) => r.bookingId === autoId)).toBe(true);
      expect(autoOnly.items.some((r) => r.bookingId === reviewedId)).toBe(
        false,
      );
    });

    it("paginates without overlapping rows across pages", async () => {
      const p0 = await service.listPersisted({ skip: 0, take: 2 });
      const p1 = await service.listPersisted({ skip: 2, take: 2 });
      expect(p0.total).toBe(p1.total);
      const ids0 = p0.items.map((r) => r.bookingId);
      const ids1 = p1.items.map((r) => r.bookingId);
      expect(ids0.some((id) => ids1.includes(id))).toBe(false);
    });

    it("orders by updatedAt descending (newest first)", async () => {
      const { bookingId: olderBid } = await createCustomerAndBooking();
      await service.upsertLatestAuthorityResult(olderBid, {
        surfaces: ["older"],
        problems: [],
        methods: [],
        reasons: [],
        resolutionVersion: 1,
      });
      await new Promise((r) => setTimeout(r, 60));
      const { bookingId: newerBid } = await createCustomerAndBooking();
      await service.upsertLatestAuthorityResult(newerBid, {
        surfaces: ["newer"],
        problems: [],
        methods: [],
        reasons: [],
        resolutionVersion: 1,
      });
      const page = await service.listPersisted({ skip: 0, take: 200 });
      const idxOlder = page.items.findIndex((r) => r.bookingId === olderBid);
      const idxNewer = page.items.findIndex((r) => r.bookingId === newerBid);
      expect(idxOlder).toBeGreaterThanOrEqual(0);
      expect(idxNewer).toBeGreaterThanOrEqual(0);
      expect(idxNewer).toBeLessThan(idxOlder);
    });
  });

  describe("persistResolvedAuthorityIfChanged", () => {
    const sampleResolved = (
      surfaces: string[],
    ): BookingAuthorityTagResult => ({
      surfaces,
      problems: ["grease-buildup"],
      methods: ["degreasing"],
      reasons: ["problem:grease-buildup:matched-keyword"],
    });

    it("creates persisted row on first resolution", async () => {
      const { bookingId } = await createCustomerAndBooking();
      const r = await service.persistResolvedAuthorityIfChanged(
        bookingId,
        sampleResolved(["tile"]),
      );
      expect(r.persisted).toBe(true);
      const row = await prisma.bookingAuthorityResult.findUnique({
        where: { bookingId },
      });
      expect(row).not.toBeNull();
      expect(row!.resolutionVersion).toBe(1);
    });

    it("does not write again when resolution payload is unchanged", async () => {
      const { bookingId } = await createCustomerAndBooking();
      const payload = sampleResolved(["tile"]);
      await service.persistResolvedAuthorityIfChanged(bookingId, payload);
      const afterFirst = await prisma.bookingAuthorityResult.findUnique({
        where: { bookingId },
      });
      const r2 = await service.persistResolvedAuthorityIfChanged(
        bookingId,
        payload,
      );
      expect(r2.persisted).toBe(false);
      const rows = await prisma.bookingAuthorityResult.findMany({
        where: { bookingId },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]!.id).toBe(afterFirst!.id);
      expect(rows[0]!.resolutionVersion).toBe(1);
    });

    it("updates existing row when resolution changes", async () => {
      const { bookingId } = await createCustomerAndBooking();
      await service.persistResolvedAuthorityIfChanged(
        bookingId,
        sampleResolved(["tile"]),
      );
      const changed: BookingAuthorityTagResult = {
        surfaces: ["shower-glass"],
        problems: ["hard-water-deposits"],
        methods: ["hard-water-deposit-removal"],
        reasons: ["surface:shower-glass:matched-keyword"],
      };
      const r = await service.persistResolvedAuthorityIfChanged(
        bookingId,
        changed,
      );
      expect(r.persisted).toBe(true);
      const rows = await prisma.bookingAuthorityResult.findMany({
        where: { bookingId },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]!.resolutionVersion).toBe(2);
      expect(JSON.parse(rows[0]!.surfacesJson)).toEqual(["shower-glass"]);
    });

    it("does not overwrite row when status is overridden", async () => {
      const { bookingId } = await createCustomerAndBooking();
      await service.persistResolvedAuthorityIfChanged(
        bookingId,
        sampleResolved(["tile"]),
      );
      const adminId = (
        await prisma.user.create({
          data: {
            email: `admin_persist_skip_${Date.now()}@servelink.local`,
            passwordHash: await bcrypt.hash("x", 4),
            role: Role.admin,
          },
        })
      ).id;
      userIds.push(adminId);
      await service.applyAuthorityTagOverride(
        bookingId,
        {
          surfaces: ["manual-surface"],
          problems: ["manual-problem"],
          methods: ["manual-method"],
        },
        adminId,
      );
      const before = await prisma.bookingAuthorityResult.findUnique({
        where: { bookingId },
      });
      const r = await service.persistResolvedAuthorityIfChanged(
        bookingId,
        sampleResolved(["tile"]),
      );
      expect(r.persisted).toBe(false);
      const after = await prisma.bookingAuthorityResult.findUnique({
        where: { bookingId },
      });
      expect(after!.id).toBe(before!.id);
      expect(after!.resolutionVersion).toBe(before!.resolutionVersion);
      expect(JSON.parse(after!.surfacesJson)).toEqual(["manual-surface"]);
      expect(after!.status).toBe(BookingAuthorityReviewStatus.overridden);
    });
  });

  describe("markAuthorityResultReviewed", () => {
    async function createAdminUserId(): Promise<string> {
      const passwordHash = await bcrypt.hash("x", 4);
      const u = await prisma.user.create({
        data: {
          email: `admin_auth_rev_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
          passwordHash,
          role: Role.admin,
        },
      });
      userIds.push(u.id);
      return u.id;
    }

    it("throws when no persisted row exists", async () => {
      const { bookingId } = await createCustomerAndBooking();
      const adminId = await createAdminUserId();
      await expect(
        service.markAuthorityResultReviewed(bookingId, adminId),
      ).rejects.toThrow(NotFoundException);
    });

    it("sets reviewed fields without changing tag JSON", async () => {
      const { bookingId } = await createCustomerAndBooking();
      const adminId = await createAdminUserId();
      const surfacesJson = JSON.stringify(["keep-me"]);
      await prisma.bookingAuthorityResult.create({
        data: {
          bookingId,
          surfacesJson,
          problemsJson: "[]",
          methodsJson: "[]",
          reasonsJson: "[]",
          resolutionVersion: 7,
          status: BookingAuthorityReviewStatus.auto,
        },
      });
      const row = await service.markAuthorityResultReviewed(bookingId, adminId);
      expect(row.status).toBe(BookingAuthorityReviewStatus.reviewed);
      expect(row.reviewedByUserId).toBe(adminId);
      expect(row.reviewedAt).toBeTruthy();
      expect(row.surfacesJson).toBe(surfacesJson);
      expect(row.resolutionVersion).toBe(7);
    });
  });

  describe("applyAuthorityTagOverride", () => {
    async function createAdminUserId(): Promise<string> {
      const passwordHash = await bcrypt.hash("x", 4);
      const u = await prisma.user.create({
        data: {
          email: `admin_auth_ovr_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
          passwordHash,
          role: Role.admin,
        },
      });
      userIds.push(u.id);
      return u.id;
    }

    it("throws when no persisted row exists", async () => {
      const { bookingId } = await createCustomerAndBooking();
      const adminId = await createAdminUserId();
      await expect(
        service.applyAuthorityTagOverride(
          bookingId,
          { surfaces: ["a"], problems: ["b"], methods: ["c"] },
          adminId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("replaces surfaces, problems, methods; sets overridden status and review metadata", async () => {
      const { bookingId } = await createCustomerAndBooking();
      const reasonsJson = JSON.stringify(["deterministic:keep"]);
      await prisma.bookingAuthorityResult.create({
        data: {
          bookingId,
          surfacesJson: JSON.stringify(["tile"]),
          problemsJson: JSON.stringify(["grease-buildup"]),
          methodsJson: JSON.stringify(["degreasing"]),
          reasonsJson,
          resolutionVersion: 3,
          status: BookingAuthorityReviewStatus.auto,
        },
      });
      const adminId = await createAdminUserId();
      const row = await service.applyAuthorityTagOverride(
        bookingId,
        {
          surfaces: ["countertop"],
          problems: ["stains"],
          methods: ["spot-treatment"],
        },
        adminId,
      );
      expect(row.status).toBe(BookingAuthorityReviewStatus.overridden);
      expect(row.reviewedByUserId).toBe(adminId);
      expect(row.reviewedAt).toBeTruthy();
      expect(JSON.parse(row.surfacesJson)).toEqual(["countertop"]);
      expect(JSON.parse(row.problemsJson)).toEqual(["stains"]);
      expect(JSON.parse(row.methodsJson)).toEqual(["spot-treatment"]);
      expect(row.reasonsJson).toBe(reasonsJson);
      expect(row.resolutionVersion).toBe(4);
    });

    it("preserves original reasonsJson and stores overrideReasons when provided", async () => {
      const { bookingId } = await createCustomerAndBooking();
      const reasonsJson = JSON.stringify(["resolver:a", "resolver:b"]);
      await prisma.bookingAuthorityResult.create({
        data: {
          bookingId,
          surfacesJson: "[]",
          problemsJson: "[]",
          methodsJson: "[]",
          reasonsJson,
          resolutionVersion: 1,
          status: BookingAuthorityReviewStatus.auto,
        },
      });
      const adminId = await createAdminUserId();
      const row = await service.applyAuthorityTagOverride(
        bookingId,
        {
          surfaces: ["s"],
          problems: ["p"],
          methods: ["m"],
          overrideReasons: ["operator: saw heavy soil"],
        },
        adminId,
      );
      expect(row.reasonsJson).toBe(reasonsJson);
      expect(row.overrideReasonsJson).toBe(
        JSON.stringify(["operator: saw heavy soil"]),
      );
    });

    it("leaves overrideReasonsJson unchanged when overrideReasons omitted", async () => {
      const { bookingId } = await createCustomerAndBooking();
      const firstReviewer = await createAdminUserId();
      await prisma.bookingAuthorityResult.create({
        data: {
          bookingId,
          surfacesJson: JSON.stringify(["a"]),
          problemsJson: JSON.stringify(["b"]),
          methodsJson: JSON.stringify(["c"]),
          reasonsJson: "[]",
          overrideReasonsJson: JSON.stringify(["first pass"]),
          resolutionVersion: 2,
          status: BookingAuthorityReviewStatus.overridden,
          reviewedByUserId: firstReviewer,
          reviewedAt: new Date(),
        },
      });
      const admin2 = await createAdminUserId();
      const row = await service.applyAuthorityTagOverride(
        bookingId,
        {
          surfaces: ["a2"],
          problems: ["b2"],
          methods: ["c2"],
        },
        admin2,
      );
      expect(JSON.parse(row.overrideReasonsJson!)).toEqual(["first pass"]);
      expect(row.reviewedByUserId).toBe(admin2);
    });
  });
});
