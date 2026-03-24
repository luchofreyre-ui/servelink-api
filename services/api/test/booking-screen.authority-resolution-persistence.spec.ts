import { Test } from "@nestjs/testing";
import { BookingStatus, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";
import { AuthorityModule } from "../src/modules/authority/authority.module";
import { BookingScreenService } from "../src/modules/bookings/booking-screen.service";
import { BillingService } from "../src/modules/billing/billing.service";
import { DeepCleanCalibrationService } from "../src/modules/bookings/deep-clean-calibration.service";
import { DeepCleanVisitExecutionService } from "../src/modules/bookings/deep-clean-visit-execution.service";

jest.setTimeout(25000);

describe("BookingScreenService authority resolution persistence", () => {
  let screens: BookingScreenService;
  let prisma: PrismaService;
  const bookingIds: string[] = [];
  const userIds: string[] = [];

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [PrismaModule, AuthorityModule],
      providers: [
        BookingScreenService,
        {
          provide: BillingService,
          useValue: { summarizeBooking: jest.fn() },
        },
        {
          provide: DeepCleanVisitExecutionService,
          useValue: {},
        },
        {
          provide: DeepCleanCalibrationService,
          useValue: {},
        },
      ],
    }).compile();

    screens = modRef.get(BookingScreenService);
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

  async function createCustomerWithTaggedBooking(notes: string): Promise<{
    customerId: string;
    bookingId: string;
  }> {
    const passwordHash = await bcrypt.hash("test-password", 4);
    const user = await prisma.user.create({
      data: {
        email: `screen_auth_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
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
        notes,
      },
    });
    bookingIds.push(booking.id);

    return { customerId: user.id, bookingId: booking.id };
  }

  it("screen summary path creates persisted authority result", async () => {
    const { customerId, bookingId } = await createCustomerWithTaggedBooking(
      "Kitchen tile backsplash has heavy grease buildup",
    );

    const summary = await screens.getCustomerScreenSummary(customerId);
    expect(summary.rows.length).toBeGreaterThanOrEqual(1);
    const row = summary.rows.find(
      (r) => r.bookingId === bookingId,
    ) as Record<string, unknown> | undefined;
    expect(row?.authorityTags).toBeDefined();

    const persisted = await prisma.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });
    expect(persisted).not.toBeNull();
    expect(JSON.parse(persisted!.surfacesJson)).toContain("tile");
  });

  it("repeated screen summary with same inputs does not duplicate rows or bump version", async () => {
    const { customerId, bookingId } = await createCustomerWithTaggedBooking(
      "Shower glass hard water spots",
    );

    await screens.getCustomerScreenSummary(customerId);
    const afterOnce = await prisma.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });
    expect(afterOnce).not.toBeNull();
    const v1 = afterOnce!.resolutionVersion;

    await screens.getCustomerScreenSummary(customerId);
    const afterTwice = await prisma.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });
    const count = await prisma.bookingAuthorityResult.count({
      where: { bookingId },
    });
    expect(count).toBe(1);
    expect(afterTwice!.resolutionVersion).toBe(v1);
    expect(afterTwice!.id).toBe(afterOnce!.id);
  });

  it("changed booking notes updates persisted authority record", async () => {
    const { customerId, bookingId } = await createCustomerWithTaggedBooking(
      "Neutral cleaning only dusty shelves",
    );

    await screens.getCustomerScreenSummary(customerId);
    const mid = await prisma.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });
    expect(mid).not.toBeNull();
    const versionBefore = mid!.resolutionVersion;

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        notes: "Shower glass limescale and soap scum",
      },
    });

    await screens.getCustomerScreenSummary(customerId);
    const after = await prisma.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });
    expect(await prisma.bookingAuthorityResult.count({ where: { bookingId } })).toBe(
      1,
    );
    expect(after!.resolutionVersion).toBeGreaterThan(versionBefore);
    expect(JSON.parse(after!.surfacesJson)).toContain("shower-glass");
  });
});
