import { Test } from "@nestjs/testing";
import {
  BookingAuthorityMismatchType,
  BookingAuthorityReviewStatus,
  BookingStatus,
  Role,
} from "@prisma/client";
import * as bcrypt from "bcrypt";

import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";
import { BookingAuthorityMismatchService } from "../src/modules/authority/booking-authority-mismatch.service";

jest.setTimeout(20000);

describe("BookingAuthorityMismatchService", () => {
  let service: BookingAuthorityMismatchService;
  let prisma: PrismaService;
  const bookingIds: string[] = [];
  const userIds: string[] = [];

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [BookingAuthorityMismatchService],
    }).compile();

    service = modRef.get(BookingAuthorityMismatchService);
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

  async function seedAuthorityRow(): Promise<{
    bookingId: string;
    authorityResultId: string;
    adminUserId: string;
  }> {
    const passwordHash = await bcrypt.hash("pw", 4);
    const customer = await prisma.user.create({
      data: {
        email: `mm_cust_${Date.now()}_${Math.random().toString(36).slice(2)}@x.local`,
        passwordHash,
        role: Role.customer,
      },
    });
    userIds.push(customer.id);

    const admin = await prisma.user.create({
      data: {
        email: `mm_adm_${Date.now()}_${Math.random().toString(36).slice(2)}@x.local`,
        passwordHash,
        role: Role.admin,
      },
    });
    userIds.push(admin.id);

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        status: BookingStatus.pending_payment,
      },
    });
    bookingIds.push(booking.id);

    const row = await prisma.bookingAuthorityResult.create({
      data: {
        bookingId: booking.id,
        surfacesJson: JSON.stringify(["tile"]),
        problemsJson: JSON.stringify(["grease-buildup"]),
        methodsJson: JSON.stringify(["degreasing"]),
        reasonsJson: JSON.stringify(["r1"]),
        resolutionVersion: 1,
        status: BookingAuthorityReviewStatus.auto,
      },
    });

    return {
      bookingId: booking.id,
      authorityResultId: row.id,
      adminUserId: admin.id,
    };
  }

  it("creates a mismatch record", async () => {
    const { bookingId, authorityResultId, adminUserId } = await seedAuthorityRow();

    const rec = await service.createMismatchRecord({
      bookingId,
      authorityResultId,
      mismatchType: BookingAuthorityMismatchType.incorrect_problem,
      notes: "resolver missed scope",
      actorUserId: adminUserId,
    });

    expect(rec.id).toBeTruthy();
    expect(rec.mismatchType).toBe(BookingAuthorityMismatchType.incorrect_problem);
    expect(rec.notes).toBe("resolver missed scope");
    expect(rec.actorUserId).toBe(adminUserId);
    expect(rec.createdAt).toBeInstanceOf(Date);
  });

  it("lists mismatches for a booking ordered newest first", async () => {
    const { bookingId, authorityResultId, adminUserId } = await seedAuthorityRow();

    const a = await service.createMismatchRecord({
      bookingId,
      authorityResultId,
      mismatchType: BookingAuthorityMismatchType.missing_surface,
      actorUserId: adminUserId,
    });
    await new Promise((r) => setTimeout(r, 5));
    const b = await service.createMismatchRecord({
      bookingId,
      authorityResultId,
      mismatchType: BookingAuthorityMismatchType.other,
      actorUserId: adminUserId,
    });

    const list = await service.listMismatchesForBooking(bookingId);
    expect(list.map((x) => x.id)).toEqual([b.id, a.id]);
  });

  it("paginates recent mismatches by createdAt desc", async () => {
    const { bookingId, authorityResultId, adminUserId } = await seedAuthorityRow();

    const older = await service.createMismatchRecord({
      bookingId,
      authorityResultId,
      mismatchType: BookingAuthorityMismatchType.under_tagging,
      actorUserId: adminUserId,
    });
    await new Promise((r) => setTimeout(r, 15));
    const newer = await service.createMismatchRecord({
      bookingId,
      authorityResultId,
      mismatchType: BookingAuthorityMismatchType.over_tagging,
      actorUserId: adminUserId,
    });

    const wide = await service.listRecentMismatches({ skip: 0, take: 100 });
    const idxNew = wide.items.findIndex((x) => x.id === newer.id);
    const idxOld = wide.items.findIndex((x) => x.id === older.id);
    expect(idxNew).toBeGreaterThanOrEqual(0);
    expect(idxOld).toBeGreaterThanOrEqual(0);
    expect(idxNew).toBeLessThan(idxOld);
    expect(wide.total).toBeGreaterThanOrEqual(2);
  });
});
