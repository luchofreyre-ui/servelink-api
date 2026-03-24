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

describe("Authority admin drift summary (E2E)", () => {
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
    const adminEmail = `admin_auth_drift_${ts}@servelink.local`;
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
        email: `cust_drift_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
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

  it("lists bookings with repeated mismatch activity and stable ordering", async () => {
    const driftProb = `drift_prob_${Date.now()}`;
    const driftSurf = `drift_surf_${Date.now()}`;
    const b = await createCustomerBooking();
    const row = await prisma.bookingAuthorityResult.create({
      data: {
        bookingId: b,
        surfacesJson: JSON.stringify([driftSurf]),
        problemsJson: JSON.stringify([driftProb]),
        methodsJson: JSON.stringify(["degreasing"]),
        reasonsJson: "[]",
        resolutionVersion: 1,
        status: BookingAuthorityReviewStatus.auto,
      },
    });

    await prisma.bookingAuthorityMismatch.create({
      data: {
        bookingId: b,
        authorityResultId: row.id,
        mismatchType: BookingAuthorityMismatchType.other,
        actorUserId: adminUserId,
      },
    });
    await prisma.bookingAuthorityMismatch.create({
      data: {
        bookingId: b,
        authorityResultId: row.id,
        mismatchType: BookingAuthorityMismatchType.other,
        actorUserId: adminUserId,
      },
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/drift")
      .query({ topLimit: 30 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.kind).toBe("booking_authority_drift_summary");
    expect(res.body.mismatchTypeCountsInScope).toBeDefined();
    expect(typeof res.body.mismatchTypeCountsInScope.other).toBe("number");
    expect(Array.isArray(res.body.topUnstableTags)).toBe(true);
    const unstable = res.body.topUnstableTags as {
      tag: string;
      instabilityScore: number;
    }[];
    const uHit = unstable.find((x) => x.tag === driftProb);
    expect(uHit?.instabilityScore).toBeGreaterThanOrEqual(2);

    const repeated = res.body.bookingsWithRepeatedMismatchActivity as {
      bookingId: string;
      mismatchCount: number;
    }[];
    const hit = repeated.find((x) => x.bookingId === b);
    expect(hit?.mismatchCount).toBeGreaterThanOrEqual(2);

    for (let i = 1; i < repeated.length; i++) {
      const prev = repeated[i - 1]!;
      const cur = repeated[i]!;
      if (cur.mismatchCount === prev.mismatchCount) {
        expect(cur.bookingId.localeCompare(prev.bookingId)).toBeGreaterThan(0);
      } else {
        expect(cur.mismatchCount).toBeLessThanOrEqual(prev.mismatchCount);
      }
    }

    const mf = res.body.tagsHighestMismatchFrequency.problems as {
      tag: string;
      bookingCount: number;
    }[];
    const pHit = mf.find((x) => x.tag === driftProb);
    expect(pHit?.bookingCount).toBeGreaterThanOrEqual(2);
    const sf = res.body.tagsHighestMismatchFrequency.surfaces as {
      tag: string;
      bookingCount: number;
    }[];
    expect(sf.find((x) => x.tag === driftSurf)?.bookingCount).toBeGreaterThanOrEqual(2);
  });

  it("surfaces repeated resolution activity for high resolutionVersion overrides", async () => {
    const b = await createCustomerBooking();
    await prisma.bookingAuthorityResult.create({
      data: {
        bookingId: b,
        surfacesJson: "[]",
        problemsJson: "[]",
        methodsJson: "[]",
        reasonsJson: "[]",
        resolutionVersion: 4,
        status: BookingAuthorityReviewStatus.overridden,
      },
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/drift")
      .query({ topLimit: 10 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const heavy = res.body.bookingsWithRepeatedResolutionActivity as {
      bookingId: string;
      resolutionVersion: number;
    }[];
    const hit = heavy.find((x) => x.bookingId === b);
    expect(hit?.resolutionVersion).toBe(4);
  });

  it("override trend summary counts are non-negative", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/drift")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.recentOverrideTrendSummary.authorityResultsOverriddenInScope).toBeGreaterThanOrEqual(
      0,
    );
    expect(res.body.recentOverrideTrendSummary.mismatchRecordsCreatedInScope).toBeGreaterThanOrEqual(
      0,
    );
  });
});
