import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { ExecutionService } from "../src/modules/execution/execution.service";
import {
  BookingStatus,
  OpsAnomalyType,
  Role,
  TrustEventType,
} from "@prisma/client";

jest.setTimeout(25000);

describe("Execution (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let execution: ExecutionService;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    execution = app.get(ExecutionService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function seedBookingWithFo() {
    const passwordHash = await bcrypt.hash("pw", 10);
    const cust = await prisma.user.create({
      data: {
        email: `exec_c_${Date.now()}@servelink.local`,
        passwordHash,
        role: Role.customer,
      },
    });
    const foUser = await prisma.user.create({
      data: {
        email: `exec_f_${Date.now()}@servelink.local`,
        passwordHash,
        role: Role.fo,
      },
    });
    const fo = await prisma.franchiseOwner.create({
      data: { userId: foUser.id, status: "active" },
    });
    const booking = await prisma.booking.create({
      data: {
        customerId: cust.id,
        status: BookingStatus.assigned,
        hourlyRateCents: 6500,
        estimatedHours: 2,
        foId: fo.id,
      },
    });
    return { bookingId: booking.id, foId: fo.id };
  }

  it("cannot complete before start", async () => {
    const { bookingId } = await seedBookingWithFo();

    await expect(execution.completeJob(bookingId)).rejects.toThrow(
      "Cannot complete job before start",
    );
  });

  it("anomaly created on premature complete", async () => {
    const { bookingId, foId } = await seedBookingWithFo();

    try {
      await execution.completeJob(bookingId);
    } catch {
      /* expected */
    }

    const anomaly = await prisma.opsAnomaly.findFirst({
      where: {
        bookingId,
        type: OpsAnomalyType.execution_missing_start,
      },
    });
    expect(anomaly).toBeTruthy();
    expect(anomaly?.foId).toBe(foId);
  });

  it("start records trust event", async () => {
    const { bookingId, foId } = await seedBookingWithFo();

    await execution.startJob(bookingId);

    const ev = await prisma.trustEvent.findFirst({
      where: { bookingId, type: TrustEventType.start },
    });
    expect(ev).toBeTruthy();
    expect(ev?.foId).toBe(foId);
  });

  it("complete records trust event with foId", async () => {
    const { bookingId, foId } = await seedBookingWithFo();

    await execution.startJob(bookingId);
    await execution.completeJob(bookingId);

    const ev = await prisma.trustEvent.findFirst({
      where: { bookingId, type: TrustEventType.complete },
    });
    expect(ev).toBeTruthy();
    expect(ev?.foId).toBe(foId);
  });
});
