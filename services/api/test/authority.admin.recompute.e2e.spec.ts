import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import {
  BookingAuthorityReviewStatus,
  BookingStatus,
  Role,
} from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(30000);

describe("Authority admin recompute (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  const password = "test-password";

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = Date.now();
    const adminEmail = `admin_recomp_${ts}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: Role.admin },
    });
    const adminLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = adminLogin.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createBookingWithNotes(notes: string): Promise<{
    bookingId: string;
    customerId: string;
  }> {
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await prisma.user.create({
      data: {
        email: `cust_rc_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
        passwordHash,
        role: Role.customer,
      },
    });
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        status: BookingStatus.pending_payment,
        notes,
      },
    });
    return { bookingId: booking.id, customerId: customer.id };
  }

  it("no_persisted_row returns resolver preview without creating row", async () => {
    const { bookingId, customerId } = await createBookingWithNotes(
      "Kitchen tile backsplash has heavy grease buildup",
    );

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${bookingId}/recompute`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    expect(res.body.kind).toBe("booking_authority_recompute_result");
    expect(res.body.outcome).toBe("no_persisted_row");
    expect(res.body.uiOutcome).toBe("derived_preview_only");
    expect(typeof res.body.uiSummary).toBe("string");
    expect(res.body.resolvedPreview?.problems?.length).toBeGreaterThan(0);

    const row = await prisma.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });
    expect(row).toBeNull();

    await prisma.booking.delete({ where: { id: bookingId } });
    await prisma.user.delete({ where: { id: customerId } });
  });

  it("skipped_overridden when status is overridden", async () => {
    const { bookingId, customerId } = await createBookingWithNotes("test");
    await prisma.bookingAuthorityResult.create({
      data: {
        bookingId,
        surfacesJson: JSON.stringify(["tile"]),
        problemsJson: JSON.stringify(["grease-buildup"]),
        methodsJson: JSON.stringify(["degreasing"]),
        reasonsJson: "[]",
        resolutionVersion: 2,
        status: BookingAuthorityReviewStatus.overridden,
      },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${bookingId}/recompute`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    expect(res.body.outcome).toBe("skipped_overridden");
    expect(res.body.uiOutcome).toBe("skipped_overridden");
    expect(res.body.persisted?.status).toBe(BookingAuthorityReviewStatus.overridden);

    await prisma.booking.delete({ where: { id: bookingId } });
    await prisma.user.delete({ where: { id: customerId } });
  });

  it("applied updates auto row from resolver", async () => {
    const { bookingId, customerId } = await createBookingWithNotes(
      "Kitchen tile backsplash has heavy grease buildup",
    );
    await prisma.bookingAuthorityResult.create({
      data: {
        bookingId,
        surfacesJson: JSON.stringify([]),
        problemsJson: JSON.stringify([]),
        methodsJson: JSON.stringify([]),
        reasonsJson: "[]",
        resolutionVersion: 1,
        status: BookingAuthorityReviewStatus.auto,
      },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${bookingId}/recompute`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    expect(res.body.outcome).toBe("applied");
    expect(res.body.uiOutcome).toBe("recomputed");
    expect(res.body.unchanged).toBe(false);
    expect(res.body.persisted?.problems?.length).toBeGreaterThan(0);

    await prisma.booking.delete({ where: { id: bookingId } });
    await prisma.user.delete({ where: { id: customerId } });
  });
});
