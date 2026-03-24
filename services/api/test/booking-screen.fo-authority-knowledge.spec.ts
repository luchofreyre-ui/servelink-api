import { Test } from "@nestjs/testing";
import {
  BookingAuthorityReviewStatus,
  BookingStatus,
  Role,
} from "@prisma/client";
import * as bcrypt from "bcrypt";

import { AUTHORITY_SNAPSHOT } from "../src/modules/authority/authority.snapshot";
import { AuthorityModule } from "../src/modules/authority/authority.module";
import { BookingScreenService } from "../src/modules/bookings/booking-screen.service";
import { DeepCleanCalibrationService } from "../src/modules/bookings/deep-clean-calibration.service";
import { DeepCleanVisitExecutionService } from "../src/modules/bookings/deep-clean-visit-execution.service";
import { BillingService } from "../src/modules/billing/billing.service";
import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

describe("BookingScreenService FO authority knowledgeLinks", () => {
  let screens: BookingScreenService;
  let prisma: PrismaService;
  const bookingIds: string[] = [];
  const userIds: string[] = [];
  const foIds: string[] = [];

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
    if (foIds.length) {
      await prisma.franchiseOwner.deleteMany({ where: { id: { in: foIds } } });
    }
    if (userIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  async function createFoCustomerAndBooking(opts: {
    notes: string;
    withPersistedAuthority?: {
      surfaces: string[];
      problems: string[];
      methods: string[];
    };
  }): Promise<{ foId: string; bookingId: string }> {
    const passwordHash = await bcrypt.hash("test-password", 4);
    const customer = await prisma.user.create({
      data: {
        email: `fo_kl_cust_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
        passwordHash,
        role: Role.customer,
      },
    });
    userIds.push(customer.id);

    const foUser = await prisma.user.create({
      data: {
        email: `fo_kl_fo_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
        passwordHash,
        role: Role.fo,
      },
    });
    userIds.push(foUser.id);

    const fo = await prisma.franchiseOwner.create({
      data: { userId: foUser.id },
    });
    foIds.push(fo.id);

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        foId: fo.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        status: BookingStatus.assigned,
        notes: opts.notes,
      },
    });
    bookingIds.push(booking.id);

    if (opts.withPersistedAuthority) {
      await prisma.bookingAuthorityResult.create({
        data: {
          bookingId: booking.id,
          surfacesJson: JSON.stringify(opts.withPersistedAuthority.surfaces),
          problemsJson: JSON.stringify(opts.withPersistedAuthority.problems),
          methodsJson: JSON.stringify(opts.withPersistedAuthority.methods),
          reasonsJson: JSON.stringify([]),
          resolutionVersion: 1,
          status: BookingAuthorityReviewStatus.auto,
        },
      });
    }

    return { foId: fo.id, bookingId: booking.id };
  }

  it("includes knowledgeLinks when authority tags resolve (derived fallback)", async () => {
    const { foId, bookingId } = await createFoCustomerAndBooking({
      notes: "Kitchen tile backsplash has heavy grease buildup",
    });

    const summary = await screens.getFoScreenSummary(foId);
    const row = summary.queue.rows.find(
      (r) => (r as { bookingId: string }).bookingId === bookingId,
    ) as Record<string, unknown> | undefined;

    expect(row?.authorityTagSource).toBe("derived");
    expect(row?.authorityReviewStatus).toBeNull();
    expect(row?.authorityHasTaggedRows).toBe(true);
    expect(Array.isArray(row?.knowledgeLinks)).toBe(true);
    expect((row?.knowledgeLinks as unknown[]).length).toBeGreaterThan(0);
    const first = (row?.knowledgeLinks as { pathname?: string }[])[0];
    expect(first?.pathname).toMatch(/^\//);

    const persisted = await prisma.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });
    expect(persisted).not.toBeNull();
  });

  it("prefers persisted BookingAuthorityResult over note-derived tags", async () => {
    const { foId, bookingId } = await createFoCustomerAndBooking({
      notes: "Kitchen tile backsplash has heavy grease buildup",
      withPersistedAuthority: {
        surfaces: [],
        problems: ["limescale"],
        methods: [],
      },
    });

    const summary = await screens.getFoScreenSummary(foId);
    const row = summary.queue.rows.find(
      (r) => (r as { bookingId: string }).bookingId === bookingId,
    ) as Record<string, unknown> | undefined;

    expect(row?.authorityTagSource).toBe("persisted");
    expect((row?.authorityTags as { problems: string[] }).problems).toEqual([
      "limescale",
    ]);
    const links = row?.knowledgeLinks as { pathname: string }[];
    expect(links.some((l) => l.pathname === "/problems/hard-water-deposits")).toBe(
      true,
    );
  });

  it("caps knowledgeLinks length for large tag sets", async () => {
    const { foId, bookingId } = await createFoCustomerAndBooking({
      notes: "Minimal",
      withPersistedAuthority: {
        surfaces: [...AUTHORITY_SNAPSHOT.surfaces],
        problems: [...AUTHORITY_SNAPSHOT.problems],
        methods: [...AUTHORITY_SNAPSHOT.methods],
      },
    });

    const summary = await screens.getFoScreenSummary(foId);
    const row = summary.queue.rows.find(
      (r) => (r as { bookingId: string }).bookingId === bookingId,
    ) as Record<string, unknown> | undefined;

    const links = row?.knowledgeLinks as unknown[];
    expect(links.length).toBe(12);
  });

  it("buildBookingScreen attaches knowledgeLinks for FO option", async () => {
    const { bookingId } = await createFoCustomerAndBooking({
      notes: "Shower glass limescale and soap scum",
    });

    const screen = await screens.buildBookingScreen(bookingId, {
      includeFoKnowledgeLinks: true,
    });

    expect(screen.authorityTagSource).toBeDefined();
    expect(screen.authorityReviewStatus).toBeNull();
    expect(screen.authorityHasTaggedRows).toBe(true);
    expect(Array.isArray(screen.knowledgeLinks)).toBe(true);
    expect((screen.knowledgeLinks as unknown[]).length).toBeGreaterThan(0);
  });

  it("buildBookingScreen omits knowledgeLinks without FO option", async () => {
    const { bookingId } = await createFoCustomerAndBooking({
      notes: "Shower glass limescale and soap scum",
    });

    const screen = await screens.buildBookingScreen(bookingId);

    expect(screen.knowledgeLinks).toBeUndefined();
    expect(screen.authorityTagSource).toBeUndefined();
    expect(screen.authorityReviewStatus).toBeUndefined();
    expect(screen.authorityHasTaggedRows).toBeUndefined();
  });
});
