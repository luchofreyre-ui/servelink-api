import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { DispatchService } from "../src/modules/dispatch/dispatch.service";
import { BookingStatus, Role, TrustEventType } from "@prisma/client";

jest.setTimeout(25000);

describe("Dispatch ranking (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dispatch: DispatchService;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    dispatch = app.get(DispatchService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("unavailable FO ranks below available FO", async () => {
    const passwordHash = await bcrypt.hash("pw", 10);
    const cust = await prisma.user.create({
      data: {
        email: `rank_c_${Date.now()}@servelink.local`,
        passwordHash,
        role: Role.customer,
      },
    });

    const foAvailUser = await prisma.user.create({
      data: {
        email: `rank_a_${Date.now()}@servelink.local`,
        passwordHash,
        role: Role.fo,
      },
    });
    const foUnavailUser = await prisma.user.create({
      data: {
        email: `rank_u_${Date.now()}@servelink.local`,
        passwordHash,
        role: Role.fo,
      },
    });

    const foAvail = await prisma.franchiseOwner.create({
      data: { userId: foAvailUser.id, status: "active" },
    });
    const foUnavail = await prisma.franchiseOwner.create({
      data: { userId: foUnavailUser.id, status: "active" },
    });

    const scheduledStart = new Date("2030-06-15T14:00:00.000Z");

    for (let d = 0; d <= 6; d++) {
      await prisma.foSchedule.create({
        data: {
          franchiseOwnerId: foAvail.id,
          dayOfWeek: d,
          startTime: "00:00",
          endTime: "23:00",
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: cust.id,
        status: BookingStatus.pending_dispatch,
        hourlyRateCents: 6500,
        estimatedHours: 2,
        scheduledStart,
      },
    });

    const ranked = await dispatch.rankCandidateFos(booking.id, [
      foUnavail.id,
      foAvail.id,
    ]);

    expect(ranked[0].foId).toBe(foAvail.id);
    expect(ranked[0].available).toBe(true);
    expect(ranked[1].available).toBe(false);
  });

  it("FO with stronger trust score ranks higher when both are available", async () => {
    const passwordHash = await bcrypt.hash("pw", 10);
    const cust = await prisma.user.create({
      data: {
        email: `rank2_c_${Date.now()}@servelink.local`,
        passwordHash,
        role: Role.customer,
      },
    });

    const foHighUser = await prisma.user.create({
      data: {
        email: `rank2_h_${Date.now()}@servelink.local`,
        passwordHash,
        role: Role.fo,
      },
    });
    const foLowUser = await prisma.user.create({
      data: {
        email: `rank2_l_${Date.now()}@servelink.local`,
        passwordHash,
        role: Role.fo,
      },
    });

    const foHigh = await prisma.franchiseOwner.create({
      data: { userId: foHighUser.id, status: "active" },
    });
    const foLow = await prisma.franchiseOwner.create({
      data: { userId: foLowUser.id, status: "active" },
    });

    const scheduledStart = new Date("2030-06-15T15:00:00.000Z");

    for (const foId of [foHigh.id, foLow.id]) {
      for (let d = 0; d <= 6; d++) {
        await prisma.foSchedule.create({
          data: {
            franchiseOwnerId: foId,
            dayOfWeek: d,
            startTime: "00:00",
            endTime: "23:00",
          },
        });
      }
    }

    const bHigh = await prisma.booking.create({
      data: {
        customerId: cust.id,
        status: BookingStatus.completed,
        hourlyRateCents: 6500,
        estimatedHours: 1,
        foId: foHigh.id,
      },
    });
    const bLow = await prisma.booking.create({
      data: {
        customerId: cust.id,
        status: BookingStatus.completed,
        hourlyRateCents: 6500,
        estimatedHours: 1,
        foId: foLow.id,
      },
    });

    for (let i = 0; i < 5; i++) {
      await prisma.trustEvent.create({
        data: {
          bookingId: bHigh.id,
          foId: foHigh.id,
          type: TrustEventType.qc_pass,
        },
      });
    }
    for (let i = 0; i < 3; i++) {
      await prisma.trustEvent.create({
        data: {
          bookingId: bLow.id,
          foId: foLow.id,
          type: TrustEventType.qc_fail,
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: cust.id,
        status: BookingStatus.pending_dispatch,
        hourlyRateCents: 6500,
        estimatedHours: 2,
        scheduledStart,
      },
    });

    const ranked = await dispatch.rankCandidateFos(booking.id, [
      foLow.id,
      foHigh.id,
    ]);

    expect(ranked[0].foId).toBe(foHigh.id);
    expect(ranked[0].dispatchScore).toBeGreaterThan(ranked[1].dispatchScore);
  });
});
