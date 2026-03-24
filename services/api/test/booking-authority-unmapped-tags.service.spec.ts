import { BookingAuthorityReviewStatus, BookingStatus, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { Test } from "@nestjs/testing";
import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";
import { BookingAuthorityUnmappedTagsService } from "../src/modules/authority/booking-authority-unmapped-tags.service";

jest.setTimeout(25000);

describe("BookingAuthorityUnmappedTagsService", () => {
  let service: BookingAuthorityUnmappedTagsService;
  let prisma: PrismaService;
  const bookingIds: string[] = [];
  const userIds: string[] = [];

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [BookingAuthorityUnmappedTagsService],
    }).compile();
    service = modRef.get(BookingAuthorityUnmappedTagsService);
    prisma = modRef.get(PrismaService);
  });

  afterAll(async () => {
    if (bookingIds.length) {
      await prisma.bookingAuthorityResult.deleteMany({
        where: { bookingId: { in: bookingIds } },
      });
      await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }
    if (userIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  it("aggregates off-snapshot tags with deterministic shape", async () => {
    const passwordHash = await bcrypt.hash("pw", 4);
    const user = await prisma.user.create({
      data: {
        email: `unmap_${Date.now()}@servelink.local`,
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
        notes: "x",
      },
    });
    bookingIds.push(booking.id);

    await prisma.bookingAuthorityResult.create({
      data: {
        bookingId: booking.id,
        surfacesJson: JSON.stringify(["unmap_test_surface_zz"]),
        problemsJson: JSON.stringify([
          "unmap_test_problem_zz",
          "unmap_test_problem_zz",
        ]),
        methodsJson: JSON.stringify(["degreasing"]),
        reasonsJson: JSON.stringify([]),
        resolutionVersion: 1,
        status: BookingAuthorityReviewStatus.auto,
      },
    });

    const out = await service.buildUnmappedTagsSummary({
      toIso: new Date(),
      maxRowsScan: 50,
    });

    expect(out.kind).toBe("booking_authority_unmapped_tags");
    expect(out.maxRowsScan).toBe(50);
    expect(out.rowsScanned).toBeGreaterThanOrEqual(1);
    const surf = out.items.find((i) => i.axis === "surface" && i.tag === "unmap_test_surface_zz");
    const prob = out.items.find((i) => i.axis === "problem" && i.tag === "unmap_test_problem_zz");
    expect(surf?.bookingCount).toBe(1);
    expect(prob?.bookingCount).toBe(1);
  });
});
