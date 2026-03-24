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

jest.setTimeout(35000);

describe("Authority admin learning activity (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  const password = "test-password";
  const bookingIds: string[] = [];
  const customerIds: string[] = [];

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = Date.now();
    const adminEmail = `admin_learn_${ts}@servelink.local`;
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
    if (bookingIds.length) {
      await prisma.bookingAuthorityResult.deleteMany({
        where: { bookingId: { in: bookingIds } },
      });
      await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }
    if (customerIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: customerIds } } });
    }
    await app.close();
  });

  async function seedRow(status: BookingAuthorityReviewStatus): Promise<string> {
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await prisma.user.create({
      data: {
        email: `cust_learn_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
        passwordHash,
        role: Role.customer,
      },
    });
    customerIds.push(customer.id);
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        status: BookingStatus.pending_payment,
        notes: "Kitchen tile",
      },
    });
    bookingIds.push(booking.id);
    await prisma.bookingAuthorityResult.create({
      data: {
        bookingId: booking.id,
        surfacesJson: JSON.stringify(["tile"]),
        problemsJson: JSON.stringify([]),
        methodsJson: JSON.stringify([]),
        reasonsJson: JSON.stringify([]),
        resolutionVersion: 1,
        status,
      },
    });
    return booking.id;
  }

  it("returns learning-activity JSON shape", async () => {
    await seedRow(BookingAuthorityReviewStatus.auto);

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/learning-activity")
      .query({ limit: 5, offset: 0, windowHours: 168 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.kind).toBe("booking_authority_learning_activity");
    expect(res.body.windowUsed).not.toBeNull();
    expect(res.body.windowUsed.fromIso).toBeTruthy();
    expect(res.body.windowUsed.toIso).toBeTruthy();
    expect(typeof res.body.total).toBe("number");
    expect(res.body.offset).toBe(0);
    expect(res.body.limit).toBe(5);
    expect(Array.isArray(res.body.items)).toBe(true);
    const item = res.body.items.find((x: { bookingId: string }) =>
      bookingIds.includes(x.bookingId),
    );
    expect(item).toBeTruthy();
    expect(item.status).toBe(BookingAuthorityReviewStatus.auto);
    expect(item.reviewMetadata).toEqual(
      expect.objectContaining({
        reviewedByUserId: null,
        reviewedAt: null,
      }),
    );
    expect(item.originalTags).toEqual(
      expect.objectContaining({
        surfaces: expect.any(Array),
        problems: expect.any(Array),
        methods: expect.any(Array),
        reasons: expect.any(Array),
      }),
    );
    expect(item.overrideTags).toBeNull();
    expect(item.updatedAt).toBeTruthy();
  });

  it("paginates with offset and limit", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/learning-activity")
      .query({ limit: 1, offset: 0, windowHours: 8760 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.items.length).toBeLessThanOrEqual(1);
    expect(res.body.limit).toBe(1);
    expect(res.body.offset).toBe(0);

    const res2 = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/learning-activity")
      .query({ limit: 1, offset: 1, windowHours: 8760 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res2.body.limit).toBe(1);
    expect(res2.body.offset).toBe(1);
    if (res.body.items[0] && res2.body.items[0]) {
      expect(res.body.items[0].bookingId).not.toBe(res2.body.items[0].bookingId);
    }
  });
});
