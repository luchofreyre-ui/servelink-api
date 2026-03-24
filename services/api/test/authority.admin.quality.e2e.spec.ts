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

jest.setTimeout(35000);

describe("Authority admin quality report (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminUserId: string;
  const password = "test-password";
  const bookingIds: string[] = [];

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = Date.now();
    const adminEmail = `admin_auth_qual_${ts}@servelink.local`;
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
    if (bookingIds.length) {
      await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }
    await app.close();
  });

  async function createCustomerBooking(): Promise<string> {
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await prisma.user.create({
      data: {
        email: `cust_qual_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
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
    bookingIds.push(booking.id);
    return booking.id;
  }

  async function createAuthorityRow(input: {
    bookingId: string;
    problems: string[];
    surfaces: string[];
    methods: string[];
    status: BookingAuthorityReviewStatus;
  }) {
    return prisma.bookingAuthorityResult.create({
      data: {
        bookingId: input.bookingId,
        surfacesJson: JSON.stringify(input.surfaces),
        problemsJson: JSON.stringify(input.problems),
        methodsJson: JSON.stringify(input.methods),
        reasonsJson: "[]",
        resolutionVersion: 1,
        status: input.status,
      },
    });
  }

  it("returns quality metrics, rates, mismatch counts, and top overridden tags", async () => {
    const tagA = `qual_prob_a_${Date.now()}`;
    const tagB = `qual_prob_b_${Date.now()}`;
    const tagS = `qual_surf_${Date.now()}`;
    const tagM = `qual_meth_${Date.now()}`;

    const b1 = await createCustomerBooking();
    const b2 = await createCustomerBooking();
    const b3 = await createCustomerBooking();
    const b4 = await createCustomerBooking();

    await createAuthorityRow({
      bookingId: b1,
      status: BookingAuthorityReviewStatus.auto,
      problems: [tagA],
      surfaces: [tagS],
      methods: [tagM],
    });
    await createAuthorityRow({
      bookingId: b2,
      status: BookingAuthorityReviewStatus.reviewed,
      problems: [tagB],
      surfaces: [tagS],
      methods: [tagM],
    });
    const o1 = await createAuthorityRow({
      bookingId: b3,
      status: BookingAuthorityReviewStatus.overridden,
      problems: [tagA, tagB],
      surfaces: [tagS],
      methods: [tagM],
    });
    const o2 = await createAuthorityRow({
      bookingId: b4,
      status: BookingAuthorityReviewStatus.overridden,
      problems: [tagA],
      surfaces: [tagS],
      methods: [tagM],
    });

    await prisma.bookingAuthorityMismatch.create({
      data: {
        bookingId: b3,
        authorityResultId: o1.id,
        mismatchType: BookingAuthorityMismatchType.incorrect_problem,
        actorUserId: adminUserId,
      },
    });
    await prisma.bookingAuthorityMismatch.create({
      data: {
        bookingId: b4,
        authorityResultId: o2.id,
        mismatchType: BookingAuthorityMismatchType.incorrect_problem,
        actorUserId: adminUserId,
      },
    });
    await prisma.bookingAuthorityMismatch.create({
      data: {
        bookingId: b4,
        authorityResultId: o2.id,
        mismatchType: BookingAuthorityMismatchType.missing_surface,
        actorUserId: adminUserId,
      },
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/quality")
      .query({ topLimit: 10 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.kind).toBe("booking_authority_quality_report");
    expect(res.body.totalRecords).toBeGreaterThanOrEqual(4);
    expect(res.body.totalReviewed).toBeGreaterThanOrEqual(1);
    expect(res.body.totalOverridden).toBeGreaterThanOrEqual(2);
    expect(res.body.reviewRate).toBeGreaterThan(0);
    expect(res.body.overrideRate).toBeGreaterThan(0);
    expect(
      res.body.mismatchCountsByType[BookingAuthorityMismatchType.incorrect_problem],
    ).toBeGreaterThanOrEqual(2);
    expect(
      res.body.mismatchCountsByType[BookingAuthorityMismatchType.missing_surface],
    ).toBeGreaterThanOrEqual(1);

    const topP = res.body.topOverriddenProblems as { tag: string; bookingCount: number }[];
    const hitA = topP.find((r) => r.tag === tagA);
    const hitB = topP.find((r) => r.tag === tagB);
    expect(hitA?.bookingCount).toBeGreaterThanOrEqual(2);
    expect(hitB?.bookingCount).toBeGreaterThanOrEqual(1);
  });

  it("scopes aggregates with windowHours (stale overridden row excluded from top overridden)", async () => {
    const prob = `qual_window_prob_${Date.now()}`;
    const bOld = await createCustomerBooking();
    const rowOld = await createAuthorityRow({
      bookingId: bOld,
      status: BookingAuthorityReviewStatus.overridden,
      problems: [prob],
      surfaces: ["s"],
      methods: ["m"],
    });
    await prisma.bookingAuthorityResult.update({
      where: { id: rowOld.id },
      data: { updatedAt: new Date("2019-06-01T12:00:00.000Z") },
    });

    const bNew = await createCustomerBooking();
    await createAuthorityRow({
      bookingId: bNew,
      status: BookingAuthorityReviewStatus.reviewed,
      problems: [prob],
      surfaces: ["s"],
      methods: ["m"],
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/quality")
      .query({ windowHours: 1, topLimit: 50 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.scopeUpdatedAtMin).toBeTruthy();
    const topP = res.body.topOverriddenProblems as { tag: string }[];
    expect(topP.some((r) => r.tag === prob)).toBe(false);
  });
});
