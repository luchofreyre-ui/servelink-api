import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import {
  BookingAuthorityMismatchType,
  BookingAuthorityReviewStatus,
  BookingStatus,
  Role,
} from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(30000);

describe("Authority mismatch capture on review/override (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminUserId: string;
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
    const adminEmail = `admin_mm_cap_${ts}@servelink.local`;
    const admin = await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: Role.admin },
    });
    adminUserId = admin.id;

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

  async function createBookingWithAuthorityRow(): Promise<{
    bookingId: string;
    authorityResultId: string;
  }> {
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await prisma.user.create({
      data: {
        email: `cust_mm_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
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
      },
    });
    const row = await prisma.bookingAuthorityResult.create({
      data: {
        bookingId: booking.id,
        surfacesJson: JSON.stringify(["tile"]),
        problemsJson: JSON.stringify(["grease-buildup"]),
        methodsJson: JSON.stringify(["degreasing"]),
        reasonsJson: JSON.stringify(["problem:grease-buildup:matched-keyword"]),
        resolutionVersion: 1,
        status: BookingAuthorityReviewStatus.auto,
      },
    });
    return { bookingId: booking.id, authorityResultId: row.id };
  }

  it("override with mismatchType creates mismatch record with actor and notes", async () => {
    const { bookingId, authorityResultId } = await createBookingWithAuthorityRow();

    await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${bookingId}/override`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        surfaces: ["tile"],
        problems: ["hard-water-deposits"],
        methods: ["degreasing"],
        mismatchType: BookingAuthorityMismatchType.incorrect_problem,
        mismatchNotes: "wrong problem family",
      })
      .expect(201);

    const mm = await prisma.bookingAuthorityMismatch.findMany({
      where: { bookingId, authorityResultId },
    });
    expect(mm).toHaveLength(1);
    expect(mm[0]!.mismatchType).toBe(
      BookingAuthorityMismatchType.incorrect_problem,
    );
    expect(mm[0]!.notes).toBe("wrong problem family");
    expect(mm[0]!.actorUserId).toBe(adminUserId);
  });

  it("override without mismatch fields does not create mismatch record", async () => {
    const { bookingId } = await createBookingWithAuthorityRow();

    await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${bookingId}/override`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        surfaces: ["shower-glass"],
        problems: ["grease-buildup"],
        methods: ["degreasing"],
      })
      .expect(201);

    const n = await prisma.bookingAuthorityMismatch.count({
      where: { bookingId },
    });
    expect(n).toBe(0);
  });

  it("POST review with optional mismatch creates mismatch record", async () => {
    const { bookingId, authorityResultId } = await createBookingWithAuthorityRow();

    await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${bookingId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        mismatchType: BookingAuthorityMismatchType.missing_method,
        mismatchNotes: "needs degreasing callout",
      })
      .expect(201);

    const mm = await prisma.bookingAuthorityMismatch.findMany({
      where: { bookingId, authorityResultId },
    });
    expect(mm).toHaveLength(1);
    expect(mm[0]!.mismatchType).toBe(BookingAuthorityMismatchType.missing_method);
    expect(mm[0]!.actorUserId).toBe(adminUserId);
  });
});
