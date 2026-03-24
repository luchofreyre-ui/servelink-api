import { Test } from "@nestjs/testing";
import { BookingAuthorityReviewStatus, BookingStatus, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { AuthorityModule } from "../src/modules/authority/authority.module";
import { BookingScreenService } from "../src/modules/bookings/booking-screen.service";
import { DeepCleanCalibrationService } from "../src/modules/bookings/deep-clean-calibration.service";
import { DeepCleanVisitExecutionService } from "../src/modules/bookings/deep-clean-visit-execution.service";
import { BillingService } from "../src/modules/billing/billing.service";
import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object";
}

describe("BookingScreenService customer authority educational context", () => {
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
          useValue: {
            summarizeBooking: jest.fn().mockResolvedValue(null),
          },
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

  async function createCustomerBooking(notes: string): Promise<string> {
    const passwordHash = await bcrypt.hash("test-password", 4);
    const user = await prisma.user.create({
      data: {
        email: `cust_edu_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
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
    return booking.id;
  }

  it("includes authorityEducationalContext with expected shape when tags resolve (derived)", async () => {
    const bookingId = await createCustomerBooking(
      "Kitchen tile backsplash has heavy grease buildup",
    );

    const screen = await screens.buildBookingScreen(bookingId, {
      includeCustomerAuthorityEducation: true,
    });

    const ctx = screen.authorityEducationalContext;
    expect(isRecord(ctx)).toBe(true);
    const c = ctx as Record<string, unknown>;
    expect(c.authorityTagSource).toBe("derived");
    expect(typeof c.educationNote).toBe("string");
    expect(Array.isArray(c.mayFocusOn)).toBe(true);
    expect(Array.isArray(c.relatedIssues)).toBe(true);
    expect(Array.isArray(c.careMethods)).toBe(true);
    expect(
      (c.mayFocusOn as { tag: string }[]).some((x) => x.tag === "tile"),
    ).toBe(true);
    expect(
      (c.relatedIssues as { tag: string }[]).some(
        (x) => x.tag === "grease-buildup",
      ),
    ).toBe(true);
    expect(c.authorityReviewStatus).toBeUndefined();
    expect(c.authorityConfidence).toBe("based_on_booking_details");
  });

  it("prefers persisted authority over note-derived tags for educational context", async () => {
    const bookingId = await createCustomerBooking(
      "Kitchen tile backsplash has heavy grease buildup",
    );

    await prisma.bookingAuthorityResult.create({
      data: {
        bookingId,
        surfacesJson: JSON.stringify(["shower-glass"]),
        problemsJson: JSON.stringify(["limescale"]),
        methodsJson: JSON.stringify(["hard-water-deposit-removal"]),
        reasonsJson: JSON.stringify([]),
        resolutionVersion: 1,
        status: BookingAuthorityReviewStatus.auto,
      },
    });

    const screen = await screens.buildBookingScreen(bookingId, {
      includeCustomerAuthorityEducation: true,
    });

    const ctx = screen.authorityEducationalContext as Record<string, unknown>;
    expect(ctx.authorityTagSource).toBe("persisted");
    expect((ctx.mayFocusOn as { tag: string }[]).map((x) => x.tag)).toContain(
      "shower-glass",
    );
    expect((ctx.mayFocusOn as { tag: string }[]).map((x) => x.tag)).not.toContain(
      "tile",
    );
    expect((ctx.relatedIssues as { tag: string }[]).map((x) => x.tag)).toContain(
      "limescale",
    );
    expect(ctx.authorityReviewStatus).toBe(BookingAuthorityReviewStatus.auto);
    expect(ctx.authorityConfidence).toBe("based_on_booking_details");
  });

  it("includes authorityReviewStatus when persisted row is reviewed", async () => {
    const bookingId = await createCustomerBooking("Kitchen tile");

    await prisma.bookingAuthorityResult.create({
      data: {
        bookingId,
        surfacesJson: JSON.stringify(["tile"]),
        problemsJson: JSON.stringify(["grease-buildup"]),
        methodsJson: JSON.stringify(["degreasing"]),
        reasonsJson: JSON.stringify([]),
        resolutionVersion: 1,
        status: BookingAuthorityReviewStatus.reviewed,
      },
    });

    const screen = await screens.buildBookingScreen(bookingId, {
      includeCustomerAuthorityEducation: true,
    });

    const ctx = screen.authorityEducationalContext as Record<string, unknown>;
    expect(ctx.authorityTagSource).toBe("persisted");
    expect(ctx.authorityReviewStatus).toBe(BookingAuthorityReviewStatus.reviewed);
    expect(ctx.authorityConfidence).toBe("reviewed_for_booking");
  });

  it("omits authorityEducationalContext when flag is off", async () => {
    const bookingId = await createCustomerBooking(
      "Kitchen tile and grease buildup",
    );

    const screen = await screens.buildBookingScreen(bookingId, {});

    expect(screen.authorityEducationalContext).toBeUndefined();
  });

  it("omits authorityEducationalContext when no snapshot-backed tags remain", async () => {
    const bookingId = await createCustomerBooking("");

    await prisma.bookingAuthorityResult.create({
      data: {
        bookingId,
        surfacesJson: JSON.stringify(["not-a-real-surface-tag"]),
        problemsJson: JSON.stringify(["fake-problem"]),
        methodsJson: JSON.stringify(["fake-method"]),
        reasonsJson: JSON.stringify([]),
        resolutionVersion: 1,
        status: BookingAuthorityReviewStatus.auto,
      },
    });

    const screen = await screens.buildBookingScreen(bookingId, {
      includeCustomerAuthorityEducation: true,
    });

    expect(screen.authorityEducationalContext).toBeUndefined();
  });
});
