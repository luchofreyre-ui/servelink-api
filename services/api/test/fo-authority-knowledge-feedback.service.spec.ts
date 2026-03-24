import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { BookingStatus, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";
import { FoAuthorityKnowledgeFeedbackService } from "../src/modules/authority/fo-authority-knowledge-feedback.service";

jest.setTimeout(20000);

describe("FoAuthorityKnowledgeFeedbackService", () => {
  let service: FoAuthorityKnowledgeFeedbackService;
  let prisma: PrismaService;
  const bookingIds: string[] = [];
  const userIds: string[] = [];

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [FoAuthorityKnowledgeFeedbackService],
    }).compile();

    service = modRef.get(FoAuthorityKnowledgeFeedbackService);
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

  async function seedFoAndBooking(): Promise<{
    foUserId: string;
    franchiseOwnerId: string;
    bookingId: string;
  }> {
    const passwordHash = await bcrypt.hash("pw", 4);
    const foUser = await prisma.user.create({
      data: {
        email: `fo_fb_${Date.now()}_${Math.random().toString(36).slice(2)}@x.local`,
        passwordHash,
        role: Role.fo,
      },
    });
    userIds.push(foUser.id);

    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: foUser.id,
        status: "active",
        safetyHold: false,
        teamSize: 1,
        maxSquareFootage: 2000,
        maxLaborMinutes: 480,
        maxDailyLaborMinutes: 600,
        homeLat: 36,
        homeLng: -96,
        maxTravelMinutes: 45,
        reliabilityScore: 90,
        displayName: "T",
        photoUrl: "https://example.com/p.jpg",
        bio: "b",
        yearsExperience: 1,
        completedJobsCount: 0,
      },
    });

    const cust = await prisma.user.create({
      data: {
        email: `c_fb_${Date.now()}@x.local`,
        passwordHash,
        role: Role.customer,
      },
    });
    userIds.push(cust.id);

    const booking = await prisma.booking.create({
      data: {
        customerId: cust.id,
        foId: fo.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        status: BookingStatus.pending_payment,
      },
    });
    bookingIds.push(booking.id);

    return {
      foUserId: foUser.id,
      franchiseOwnerId: fo.id,
      bookingId: booking.id,
    };
  }

  it("submits feedback", async () => {
    const { foUserId, bookingId, franchiseOwnerId } = await seedFoAndBooking();

    const row = await service.submitFeedback({
      foUserId,
      bookingId,
      helpful: true,
      selectedKnowledgePath: "/problems/grease-buildup",
      notes: "helped on site",
    });

    expect(row.id).toBeTruthy();
    expect(row.helpful).toBe(true);
    expect(row.franchiseOwnerId).toBe(franchiseOwnerId);

    const list = await service.listFeedbackForBooking(bookingId, franchiseOwnerId);
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe(row.id);
  });

  it("lists recent feedback by createdAt desc", async () => {
    const { foUserId, bookingId, franchiseOwnerId } = await seedFoAndBooking();

    const a = await service.submitFeedback({
      foUserId,
      bookingId,
      helpful: false,
    });
    await new Promise((r) => setTimeout(r, 15));
    const b = await service.submitFeedback({
      foUserId,
      bookingId,
      helpful: true,
    });

    const recent = await service.listRecentFeedback({ skip: 0, take: 50 });
    const ia = recent.items.findIndex((x) => x.id === a.id);
    const ib = recent.items.findIndex((x) => x.id === b.id);
    expect(ib).toBeGreaterThanOrEqual(0);
    expect(ia).toBeGreaterThanOrEqual(0);
    expect(ib).toBeLessThan(ia);

    const byBooking = await service.listFeedbackForBooking(bookingId, franchiseOwnerId);
    expect(byBooking[0]!.id).toBe(b.id);
    expect(byBooking[1]!.id).toBe(a.id);
  });

  it("rejects FO without access", async () => {
    const { bookingId } = await seedFoAndBooking();

    const passwordHash = await bcrypt.hash("pw", 4);
    const otherFoUser = await prisma.user.create({
      data: {
        email: `fo_other_${Date.now()}@x.local`,
        passwordHash,
        role: Role.fo,
      },
    });
    userIds.push(otherFoUser.id);
    await prisma.franchiseOwner.create({
      data: {
        userId: otherFoUser.id,
        status: "active",
        safetyHold: false,
        teamSize: 1,
        maxSquareFootage: 2000,
        maxLaborMinutes: 480,
        maxDailyLaborMinutes: 600,
        homeLat: 36,
        homeLng: -96,
        maxTravelMinutes: 45,
        reliabilityScore: 90,
        displayName: "O",
        photoUrl: "https://example.com/p.jpg",
        bio: "b",
        yearsExperience: 1,
        completedJobsCount: 0,
      },
    });

    await expect(
      service.submitFeedback({
        foUserId: otherFoUser.id,
        bookingId,
        helpful: true,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects unknown booking", async () => {
    const passwordHash = await bcrypt.hash("pw", 4);
    const foUser = await prisma.user.create({
      data: {
        email: `fo_nb_${Date.now()}@x.local`,
        passwordHash,
        role: Role.fo,
      },
    });
    userIds.push(foUser.id);
    await prisma.franchiseOwner.create({
      data: {
        userId: foUser.id,
        status: "active",
        safetyHold: false,
        teamSize: 1,
        maxSquareFootage: 2000,
        maxLaborMinutes: 480,
        maxDailyLaborMinutes: 600,
        homeLat: 36,
        homeLng: -96,
        maxTravelMinutes: 45,
        reliabilityScore: 90,
        displayName: "N",
        photoUrl: "https://example.com/p.jpg",
        bio: "b",
        yearsExperience: 1,
        completedJobsCount: 0,
      },
    });

    await expect(
      service.submitFeedback({
        foUserId: foUser.id,
        bookingId: "bk_nonexistent_xxx",
        helpful: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
