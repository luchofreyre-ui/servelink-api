import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { BookingEventType, OpsAlertStatus } from "@prisma/client";

jest.setTimeout(30000);

describe("Ops anomalies ack/query (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const email = `admin_${Date.now()}@servelink.local`;
    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const adminUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "admin",
      },
    });

    adminUserId = adminUser.id;

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(201);

    expect(loginRes.body?.accessToken).toBeTruthy();
    adminToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it("acks anomalies via ack/query and hides them from default inbox", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    const anomaly = await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_BILLING_SESSION_STALE",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "Test anomaly",
        }),
      } as any,
    });

    const listBefore = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const idsBefore = listBefore.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(idsBefore).toContain(anomaly.id);

    const ackRes = await request(app.getHttpServer())
      .post("/api/v1/admin/ops/anomalies/ack/query")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        type: "INTEGRITY_BILLING_SESSION_STALE",
        note: "Reviewed in E2E",
      })
      .expect(200);

    expect(ackRes.body.data?.matched).toBeGreaterThanOrEqual(1);
    expect(ackRes.body.data?.acked).toBeGreaterThanOrEqual(1);

    const listAfter = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const idsAfter = listAfter.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(idsAfter).not.toContain(anomaly.id);

    const listAcked = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?acked=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const idsAcked = listAcked.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(idsAcked).toContain(anomaly.id);
  });

  it("resolves anomalies, hides them from default inbox, and is idempotent", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_resolve_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    const anomaly = await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_DISPUTE_STALE",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "Test anomaly (resolve)",
        }),
      } as any,
    });

    // Ensure it appears in the default inbox
    const listBefore = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const idsBefore = listBefore.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(idsBefore).toContain(anomaly.id);

    // Resolve it (single)
    await request(app.getHttpServer())
      .post("/api/v1/admin/ops/anomalies/resolve")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ eventId: anomaly.id, note: "Resolved in E2E" })
      .expect(200);

    // It should disappear from default inbox
    const listAfter = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const idsAfter = listAfter.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(idsAfter).not.toContain(anomaly.id);

    // But show when including acked
    const listAcked = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?acked=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const idsAcked = listAcked.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(idsAcked).toContain(anomaly.id);

    // Verify DB fields are set (resolvedAt + status acked)
    const alert = await prisma.opsAlert.findFirst({
      where: { sourceEventId: anomaly.id },
    });

    expect(alert).toBeTruthy();
    expect(alert?.resolvedAt).toBeTruthy();
    expect(alert?.status).toBe(OpsAlertStatus.acked);

    // Resolve/query should be idempotent for already resolved
    const resolveQueryRes = await request(app.getHttpServer())
      .post("/api/v1/admin/ops/anomalies/resolve/query")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        type: "INTEGRITY_DISPUTE_STALE",
        opsStatus: "acked",
        note: "Resolve query rerun (E2E)",
      })
      .expect(200);

    expect(resolveQueryRes.body.data?.matched).toBeGreaterThanOrEqual(1);
    expect(resolveQueryRes.body.data?.resolved).toBeGreaterThanOrEqual(0);
    expect(resolveQueryRes.body.data?.alreadyResolved).toBeGreaterThanOrEqual(1);
  });

  it("writes resolve audit trail and exposes it via GET anomalies/audit", async () => {
    // Use a unique admin for this test to avoid cross-test audit contamination + clock skew issues
    const email = `admin_audit_${Date.now()}@servelink.local`;
    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const auditAdmin = await prisma.user.create({
      data: { email, passwordHash, role: "admin" },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(201);

    const auditAdminToken = loginRes.body.accessToken;
    const auditAdminUserId = auditAdmin.id;

    expect(auditAdminToken).toBeTruthy();

    const customer = await prisma.user.create({
      data: {
        email: `cust_audit_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    const anomaly = await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_BILLING_SESSION_STALE",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "Test anomaly (audit resolve)",
        }),
      } as any,
    });

    const listRes = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint&limit=50&acked=0&sinceHours=1")
      .set("Authorization", `Bearer ${auditAdminToken}`)
      .expect(200);

    const grouped = listRes.body.data?.anomalies ?? [];
    const row = grouped.find((x: any) => x.bookingId === booking.id);
    expect(row?.fingerprint).toBeTruthy();
    const fingerprint = String(row.fingerprint);

    await request(app.getHttpServer())
      .post("/api/v1/admin/ops/anomalies/resolve")
      .set("Authorization", `Bearer ${auditAdminToken}`)
      .send({ fingerprint, note: "Resolved in E2E (audit)" })
      .expect(200);

    const auditRow = await prisma.opsAlertAudit.findFirst({
      where: { fingerprint, action: "resolve", actorAdminId: auditAdminUserId },
      orderBy: { createdAt: "desc" },
      select: { fingerprint: true, action: true, createdAt: true },
    });
    expect(auditRow?.fingerprint).toBeTruthy();

    // Fetch audit history by fingerprint
    const auditRes = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies/audit")
      .set("Authorization", `Bearer ${auditAdminToken}`)
      .query({ fingerprint, limit: "50" })
      .set("Authorization", `Bearer ${auditAdminToken}`)
      .expect(200);

    const items = auditRes.body.data?.items ?? [];
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);

    // Must contain a resolve entry
    const resolveEntry = items.find((x: any) => x.action === "resolve");
    expect(resolveEntry).toBeTruthy();

    // Sorted newest-first by createdAt (if 2+ rows)
    if (items.length >= 2) {
      const t0 = new Date(items[0].createdAt).getTime();
      const t1 = new Date(items[1].createdAt).getTime();
      expect(t0).toBeGreaterThanOrEqual(t1);
    }

    // Fingerprint should match
    expect(resolveEntry.fingerprint).toBe(fingerprint);
  });

  it("exposes audit by sourceEventId and eventId (resolve by eventId)", async () => {
    // Dedicated admin for isolation
    const email = `admin_audit_q_${Date.now()}@servelink.local`;
    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const auditAdmin = await prisma.user.create({
      data: { email, passwordHash, role: "admin" },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(201);

    const token = loginRes.body?.accessToken;
    expect(token).toBeTruthy();

    // Create anomaly evidence (bookingEvent NOTE)
    const customer = await prisma.user.create({
      data: {
        email: `cust_audit_q_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    const anomaly = await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_BILLING_SESSION_STALE",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "Test anomaly (audit query modes)",
        }),
      } as any,
    });

    // Prime the rollup/evidence pipeline (ensures findTargetRollup(eventId) has a real rollup)
    const listPrime = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?sinceHours=1&limit=50")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const primeIds =
      listPrime.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(primeIds).toContain(anomaly.id);

    // Resolve by eventId (this must write audit rows with eventId + sourceEventId)
    await request(app.getHttpServer())
      .post("/api/v1/admin/ops/anomalies/resolve")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: anomaly.id, note: "Resolved in E2E (audit query modes)" })
      .expect(200);

    // Direct DB check: resolve audit exists keyed by both eventId and sourceEventId
    const auditRow = await prisma.opsAlertAudit.findFirst({
      where: {
        action: "resolve",
        eventId: anomaly.id,
        sourceEventId: anomaly.id,
        actorAdminId: auditAdmin.id,
      },
      orderBy: { createdAt: "desc" },
      select: {
        fingerprint: true,
        action: true,
        eventId: true,
        sourceEventId: true,
        createdAt: true,
      },
    });

    expect(auditRow).toBeTruthy();
    expect(auditRow?.action).toBe("resolve");
    expect(auditRow?.eventId).toBe(anomaly.id);
    expect(auditRow?.sourceEventId).toBe(anomaly.id);
    expect(auditRow?.fingerprint).toBeTruthy();

    const fingerprint = String(auditRow!.fingerprint);

    // 1) GET audit by sourceEventId
    const bySourceRes = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies/audit")
      .set("Authorization", `Bearer ${token}`)
      .query({ sourceEventId: anomaly.id, limit: "50" })
      .expect(200);

    const bySourceItems = bySourceRes.body.data?.items ?? [];
    expect(Array.isArray(bySourceItems)).toBe(true);
    expect(bySourceItems.length).toBeGreaterThanOrEqual(1);

    const bySourceResolve = bySourceItems.find((x: any) => x.action === "resolve");
    expect(bySourceResolve).toBeTruthy();
    expect(bySourceResolve.fingerprint).toBe(fingerprint);
    expect(bySourceResolve.sourceEventId ?? null).toBe(anomaly.id);

    // 2) GET audit by eventId
    const byEventRes = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies/audit")
      .set("Authorization", `Bearer ${token}`)
      .query({ eventId: anomaly.id, limit: "50" })
      .expect(200);

    const byEventItems = byEventRes.body.data?.items ?? [];
    expect(Array.isArray(byEventItems)).toBe(true);
    expect(byEventItems.length).toBeGreaterThanOrEqual(1);

    const byEventResolve = byEventItems.find((x: any) => x.action === "resolve");
    expect(byEventResolve).toBeTruthy();
    expect(byEventResolve.fingerprint).toBe(fingerprint);
    expect(byEventResolve.eventId ?? null).toBe(anomaly.id);

    expect(bySourceResolve.fingerprint).toBe(byEventResolve.fingerprint);

    // --- precedence: sourceEventId wins over eventId + fingerprint ---
    // If all three are provided, the endpoint must behave exactly like sourceEventId-only.
    const byAll = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies/audit")
      .set("Authorization", `Bearer ${token}`)
      .query({
        sourceEventId: anomaly.id,
        eventId: "definitely-not-a-real-id",
        fingerprint: "definitely-not-a-real-fingerprint",
        limit: "50",
      })
      .expect(200);

    const byAllItems = byAll.body?.data?.items ?? [];
    expect(Array.isArray(byAllItems)).toBe(true);
    expect(byAllItems.length).toBeGreaterThan(0);

    const byAllResolve = byAllItems.find((x: any) => x?.action === "resolve");
    expect(byAllResolve).toBeTruthy();

    // Must match the same resolve entry we got from sourceEventId-only
    expect(byAllResolve.fingerprint).toBe(bySourceResolve.fingerprint);
    expect(byAllResolve.eventId).toBe(bySourceResolve.eventId);
    expect(byAllResolve.sourceEventId).toBe(bySourceResolve.sourceEventId);

    // Ordering check (desc) for both modes when multiple items exist
    if (bySourceItems.length >= 2) {
      const t0 = new Date(bySourceItems[0].createdAt).getTime();
      const t1 = new Date(bySourceItems[1].createdAt).getTime();
      expect(t0).toBeGreaterThanOrEqual(t1);
    }
    if (byEventItems.length >= 2) {
      const t0 = new Date(byEventItems[0].createdAt).getTime();
      const t1 = new Date(byEventItems[1].createdAt).getTime();
      expect(t0).toBeGreaterThanOrEqual(t1);
    }
  });

  it("assigns and unassigns an anomaly", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_assign_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    const anomaly = await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_REFUND_WEBHOOK_MISSING",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "Test anomaly (assign)",
        }),
      } as any,
    });

    // It should appear and be unassigned initially
    const listBefore = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const rowBefore = (listBefore.body.data?.anomalies ?? []).find(
      (a: any) => a.id === anomaly.id,
    );
    expect(rowBefore).toBeTruthy();
    expect(rowBefore.assignedToAdminId ?? null).toBeNull();

    // Assign to the current admin user (we can read their id from the DB by token user)
    // Since our test admin is the only admin we created, just fetch it.
    const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });
    expect(adminUser?.id).toBeTruthy();

    await request(app.getHttpServer())
      .post("/api/v1/admin/ops/anomalies/assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ eventId: anomaly.id, assignedToAdminId: adminUser!.id })
      .expect(200);

    // Filter by assignedToAdminId should return it
    const listAssigned = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies?assignedToAdminId=${adminUser!.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const idsAssigned =
      listAssigned.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(idsAssigned).toContain(anomaly.id);

    // Unassign
    await request(app.getHttpServer())
      .post("/api/v1/admin/ops/anomalies/assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ eventId: anomaly.id, assignedToAdminId: null })
      .expect(200);

    const listAfter = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies?assignedToAdminId=${adminUser!.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const idsAfter =
      listAfter.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(idsAfter).not.toContain(anomaly.id);
  });

  it("supports mine=1 filtering (assigned-to-me work queue)", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_mine_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    const anomaly = await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_DISPUTE_STALE",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "Test anomaly (mine filter)",
        }),
      } as any,
    });

    // Trigger legacy materialization so OpsAlert exists with sourceEventId = anomaly.id
    await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    // Assign it to the current admin
    await request(app.getHttpServer())
      .post("/api/v1/admin/ops/anomalies/assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ eventId: anomaly.id, assignedToAdminId: adminUserId })
      .expect(200);

    // mine=1 should include it
    const mineRes = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?mine=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const mineIds = mineRes.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(mineIds).toContain(anomaly.id);
  });

  it("supports unassigned=1 filtering and mine=1 defaults sortBy=lastSeenAt", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_unassigned_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    const anomaly = await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_DISPUTE_STALE",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "Test anomaly (unassigned filter)",
        }),
      } as any,
    });

    // Trigger legacy materialization so OpsAlert exists
    await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    // unassigned=1 should include it (it starts unassigned)
    const unassignedRes1 = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?unassigned=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const unassignedIds1 =
      unassignedRes1.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(unassignedIds1).toContain(anomaly.id);

    // Assign it to this admin
    await request(app.getHttpServer())
      .post("/api/v1/admin/ops/anomalies/assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ eventId: anomaly.id, assignedToAdminId: adminUserId })
      .expect(200);

    // Now unassigned=1 should NOT include it
    const unassignedRes2 = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?unassigned=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const unassignedIds2 =
      unassignedRes2.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(unassignedIds2).not.toContain(anomaly.id);

    // mine=1 should include it and default sortBy=lastSeenAt when sortBy omitted
    const mineRes = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?mine=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(mineRes.body.data?.page?.mine).toBe(1);
    expect(mineRes.body.data?.page?.sortBy).toBe("lastSeenAt");

    const mineIds = mineRes.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(mineIds).toContain(anomaly.id);
  });

  it(
    "supports sla=dueSoon|overdue|breached filtering",
    async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_sla_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    const anomaly = await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_DISPUTE_STALE",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "Test anomaly (sla filters)",
        }),
      } as any,
    });

    // Trigger legacy materialization so OpsAlert exists
    await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const alert = await prisma.opsAlert.findUnique({
      where: { sourceEventId: anomaly.id },
    });

    expect(alert?.id).toBeTruthy();

    const now = new Date();

    // dueSoon: due within next 30 minutes
    await prisma.opsAlert.update({
      where: { id: alert!.id },
      data: {
        slaDueAt: new Date(now.getTime() + 10 * 60 * 1000),
        slaBreachedAt: null,
        status: "open",
      } as any,
    });

    const dueSoonRes = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?sla=dueSoon&slaWindowMin=30")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const dueSoonIds =
      dueSoonRes.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(dueSoonIds).toContain(anomaly.id);

    // overdue: dueAt in the past, not breached
    await prisma.opsAlert.update({
      where: { id: alert!.id },
      data: {
        slaDueAt: new Date(now.getTime() - 10 * 60 * 1000),
        slaBreachedAt: null,
        status: "open",
      } as any,
    });

    const overdueRes = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?sla=overdue")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const overdueIds =
      overdueRes.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(overdueIds).toContain(anomaly.id);

    // breached: slaBreachedAt set
    await prisma.opsAlert.update({
      where: { id: alert!.id },
      data: {
        slaBreachedAt: new Date(),
        status: "open",
      } as any,
    });

    const breachedRes = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?sla=breached")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const breachedIds =
      breachedRes.body.data?.anomalies?.map((a: any) => a.id) ?? [];
    expect(breachedIds).toContain(anomaly.id);
  },
  20000);

  it("groups by fingerprint and reports occurrences", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_fp_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    // Create 3 legacy NOTE events for the same anomaly type + booking
    for (let i = 0; i < 3; i++) {
      await prisma.bookingEvent.create({
        data: {
          bookingId: booking.id,
          type: BookingEventType.NOTE,
          note: JSON.stringify({
            type: "INTEGRITY_DISPUTE_STALE",
            bookingId: booking.id,
            observedAt: new Date().toISOString(),
            message: `Test anomaly fp ${i}`,
          }),
        } as any,
      });
    }

    // Trigger materialization + fetch grouped view
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const anomalies = res.body.data?.anomalies ?? [];
    // Find the grouped row for our booking/type
    const row = anomalies.find(
      (a: any) =>
        a.bookingId === booking.id &&
        String(a.anomalyType) === "INTEGRITY_DISPUTE_STALE",
    );

    expect(row).toBeTruthy();
    expect(row.id).toMatch(/^c/); // cuid from rollup id (not bookingEvent id)
    expect(row.occurrences).toBeGreaterThanOrEqual(3);
    expect(row.fingerprint).toBeTruthy();
  });

  it(
    "acks by fingerprint (rollup) and hides from grouped inbox",
    async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    // Create 2 events that should roll up to same fingerprint (same booking/type)
    const anomaly1 = await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_DISPUTE_STALE",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "Test anomaly 1",
        }),
      } as any,
    });

    await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_DISPUTE_STALE",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "Test anomaly 2",
        }),
      } as any,
    });

    // Trigger bridge + ensure rollup exists
    await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const rollup = await prisma.opsAlertRollup.findFirst({
      where: { bookingId: booking.id, anomalyType: "INTEGRITY_DISPUTE_STALE" as any },
    });

    expect(rollup?.fingerprint).toBeTruthy();

    // Confirm it appears in grouped inbox
    const groupedBefore = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const fpBefore =
      groupedBefore.body.data?.anomalies?.map((a: any) => a.fingerprint).filter(Boolean) ?? [];
    expect(fpBefore).toContain(rollup!.fingerprint);

    // Ack by fingerprint
    await request(app.getHttpServer())
      .post("/api/v1/admin/ops/anomalies/ack")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fingerprint: rollup!.fingerprint, note: "acked via fingerprint" })
      .expect(200);

    // Now it should be hidden from grouped inbox by default
    const groupedAfter = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const fpAfter =
      groupedAfter.body.data?.anomalies?.map((a: any) => a.fingerprint).filter(Boolean) ?? [];
    expect(fpAfter).not.toContain(rollup!.fingerprint);

    // But visible with acked=1
    const groupedAcked = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint&acked=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const fpAcked =
      groupedAcked.body.data?.anomalies?.map((a: any) => a.fingerprint).filter(Boolean) ?? [];
    expect(fpAcked).toContain(rollup!.fingerprint);

    // Evidence still exists; at least the original event ID should still be queryable in events list
    expect(anomaly1.id).toBeTruthy();
  },
  20000);

  it("assigns by fingerprint (rollup) and mine/unassigned reflect it", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_REFUND_WEBHOOK_MISSING",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "Test anomaly",
        }),
      } as any,
    });

    // Trigger bridge + rollup
    await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const rollup = await prisma.opsAlertRollup.findFirst({
      where: { bookingId: booking.id, anomalyType: "INTEGRITY_REFUND_WEBHOOK_MISSING" as any },
    });

    expect(rollup?.fingerprint).toBeTruthy();

    // Should show as unassigned
    const unassignedBefore = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint&unassigned=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const fpUnassignedBefore =
      unassignedBefore.body.data?.anomalies?.map((a: any) => a.fingerprint).filter(Boolean) ?? [];
    expect(fpUnassignedBefore).toContain(rollup!.fingerprint);

    // Assign via fingerprint
    await request(app.getHttpServer())
      .post("/api/v1/admin/ops/anomalies/assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fingerprint: rollup!.fingerprint, adminId: adminUserId })
      .expect(200);

    // Now it should NOT show as unassigned
    const unassignedAfter = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint&unassigned=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const fpUnassignedAfter =
      unassignedAfter.body.data?.anomalies?.map((a: any) => a.fingerprint).filter(Boolean) ?? [];
    expect(fpUnassignedAfter).not.toContain(rollup!.fingerprint);

    // And should show in mine=1
    const mine = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint&mine=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const fpMine =
      mine.body.data?.anomalies?.map((a: any) => a.fingerprint).filter(Boolean) ?? [];
    expect(fpMine).toContain(rollup!.fingerprint);
  });

  it("counts (evidence mode) returns totals + workQueue using lastSeenAt window", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_counts_ev_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    const anomaly = await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_DISPUTE_STALE",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "Counts evidence mode anomaly",
        }),
      } as any,
    });

    // Trigger legacy materialization so OpsAlert exists
    await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const countsRes = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies/counts")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const data = countsRes.body?.data;
    expect(data).toBeTruthy();

    expect(data.windowField).toBe("lastSeenAt");
    expect(data.mode).toBe("evidence");

    // Should report our type in totalsByType (at least 1)
    expect(Number(data.totalsByType?.INTEGRITY_DISPUTE_STALE ?? 0)).toBeGreaterThanOrEqual(1);

    // Work queue fields should exist and be numeric
    expect(Number.isFinite(Number(data.workQueue?.openTotal ?? NaN))).toBe(true);
    expect(Number.isFinite(Number(data.workQueue?.assignedToMeOpen ?? NaN))).toBe(true);
    expect(Number.isFinite(Number(data.workQueue?.unassignedOpen ?? NaN))).toBe(true);

    // sanity: ensure our legacy event is real
    expect(anomaly.id).toBeTruthy();
  });

  it("counts (rollup mode) supports groupBy=fingerprint + mine/unassigned + SLA filters", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_counts_ru_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    // Create 2 legacy NOTE events so they roll up
    for (let i = 0; i < 2; i++) {
      await prisma.bookingEvent.create({
        data: {
          bookingId: booking.id,
          type: BookingEventType.NOTE,
          note: JSON.stringify({
            type: "INTEGRITY_REFUND_WEBHOOK_MISSING",
            bookingId: booking.id,
            observedAt: new Date().toISOString(),
            message: `Counts rollup anomaly ${i}`,
          }),
        } as any,
      });
    }

    // Trigger bridge + rollup creation
    await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const rollup = await prisma.opsAlertRollup.findFirst({
      where: { bookingId: booking.id, anomalyType: "INTEGRITY_REFUND_WEBHOOK_MISSING" as any },
    });

    expect(rollup?.fingerprint).toBeTruthy();

    // Base rollup counts
    const countsRollup = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies/counts?groupBy=fingerprint")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const d0 = countsRollup.body?.data;
    expect(d0.mode).toBe("rollup");
    expect(d0.groupBy).toBe("fingerprint");
    expect(d0.windowField).toBe("lastSeenAt");
    expect(Number(d0.totalsByType?.INTEGRITY_REFUND_WEBHOOK_MISSING ?? 0)).toBeGreaterThanOrEqual(1);

    // Unassigned should include it initially
    const countsUnassigned = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies/counts?groupBy=fingerprint&unassigned=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const dUn = countsUnassigned.body?.data;
    expect(dUn.mode).toBe("rollup");
    expect(Number(dUn.workQueue?.unassignedOpen ?? 0)).toBeGreaterThanOrEqual(1);

    // Assign via fingerprint
    await request(app.getHttpServer())
      .post("/api/v1/admin/ops/anomalies/assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fingerprint: rollup!.fingerprint, adminId: adminUserId })
      .expect(200);

    // mine=1 should count it as assigned-to-me
    const countsMine = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies/counts?groupBy=fingerprint&mine=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const dMine = countsMine.body?.data;
    expect(dMine.mode).toBe("rollup");
    expect(dMine.filters?.mine).toBe(1);
    expect(Number(dMine.workQueue?.assignedToMeOpen ?? 0)).toBeGreaterThanOrEqual(1);

    // SLA: set overdue on the rollup and confirm sla=overdue filters
    const now = new Date();
    await prisma.opsAlertRollup.update({
      where: { fingerprint: rollup!.fingerprint },
      data: {
        status: "open" as any,
        slaDueAt: new Date(now.getTime() - 10 * 60 * 1000),
        slaBreachedAt: null,
        lastSeenAt: new Date(),
      } as any,
    });

    const countsOverdue = await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies/counts?groupBy=fingerprint&sla=overdue")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const dOverdue = countsOverdue.body?.data;
    expect(dOverdue.mode).toBe("rollup");
    expect(dOverdue.filters?.sla).toBe("overdue");
    // At least one overdue open should exist in this filtered view
    expect(Number(dOverdue.workQueue?.overdueOpen ?? 0)).toBeGreaterThanOrEqual(1);
  }, 20000);

  it(
    "counts() trims workQueue keys by SLA mode (regression)",
    async () => {
      // Ensure we have at least one rollup record (groupBy=fingerprint mode)
      const customer = await prisma.user.create({
        data: {
          email: `cust_keys_${Date.now()}@servelink.local`,
          passwordHash: "x",
          role: "customer",
        },
      });

      const booking = await prisma.booking.create({
        data: {
          customerId: customer.id,
          hourlyRateCents: 5000,
          estimatedHours: 1,
          currency: "usd",
          status: "completed",
        },
      });

      await prisma.bookingEvent.create({
        data: {
          bookingId: booking.id,
          type: BookingEventType.NOTE,
          note: JSON.stringify({
            type: "INTEGRITY_DISPUTE_STALE",
            bookingId: booking.id,
            observedAt: new Date().toISOString(),
            message: "keys regression seed",
          }),
        } as any,
      });

      // trigger rollup materialization
      await request(app.getHttpServer())
        .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const getKeys = async (qs: string) => {
        const res = await request(app.getHttpServer())
          .get(`/api/v1/admin/ops/anomalies/counts?groupBy=fingerprint&opsStatus=open${qs}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        const keys = Object.keys(res.body.data?.workQueue ?? {}).sort();
        return keys;
      };

      const expectedDueSoon = [
        "assignedToMeOpen",
        "dueSoonAssignedToMeOpen",
        "dueSoonOpen",
        "dueSoonUnassignedOpen",
        "openTotal",
        "unassignedOpen",
      ].sort();

      const expectedOverdue = [
        "assignedToMeOpen",
        "openTotal",
        "overdueAssignedToMeOpen",
        "overdueOpen",
        "unassignedOpen",
        "unassignedOverdueOpen",
      ].sort();

      const expectedBreached = [
        "assignedToMeOpen",
        "breachedAssignedToMeOpen",
        "breachedOpen",
        "openTotal",
        "unassignedBreachedOpen",
        "unassignedOpen",
      ].sort();

      expect(await getKeys("&sla=dueSoon&slaWindowMin=30")).toEqual(expectedDueSoon);
      expect(await getKeys("&sla=overdue")).toEqual(expectedOverdue);
      expect(await getKeys("&sla=breached")).toEqual(expectedBreached);
    },
    20000,
  );

  it("filters: bookingId + status + foId apply to list() and counts() (evidence + rollup)", async () => {
    // Seed: customer + FO + booking with foId + status, plus a legacy NOTE anomaly
    const customer = await prisma.user.create({
      data: {
        email: `cust_filters_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const foUser = await prisma.user.create({
      data: {
        email: `fo_filters_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "fo" as any,
      } as any,
    });

    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: foUser.id,
        status: "active" as any,
      } as any,
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        foId: fo.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "completed",
      },
    });

    await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: BookingEventType.NOTE,
        note: JSON.stringify({
          type: "INTEGRITY_DISPUTE_STALE",
          bookingId: booking.id,
          observedAt: new Date().toISOString(),
          message: "filters regression seed",
        }),
      } as any,
    });

    // Trigger legacy materialization (creates OpsAlert + OpsAlertRollup)
    await request(app.getHttpServer())
      .get("/api/v1/admin/ops/anomalies?groupBy=fingerprint")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    // -------------------------
    // Evidence mode: LIST filters
    // -------------------------
    const listByBooking = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies?bookingId=${booking.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const a1 = listByBooking.body?.data?.anomalies ?? [];
    expect(Array.isArray(a1)).toBe(true);
    expect(a1.length).toBeGreaterThanOrEqual(1);
    for (const a of a1) {
      expect(String(a.bookingId)).toBe(booking.id);
    }

    const listByStatus = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies?bookingId=${booking.id}&status=completed`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const a2 = listByStatus.body?.data?.anomalies ?? [];
    expect(a2.length).toBeGreaterThanOrEqual(1);
    for (const a of a2) {
      expect(String(a.bookingId)).toBe(booking.id);
      expect(String(a.bookingStatus)).toBe("completed");
    }

    const listByFo = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies?bookingId=${booking.id}&foId=${fo.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const a3 = listByFo.body?.data?.anomalies ?? [];
    expect(a3.length).toBeGreaterThanOrEqual(1);
    for (const a of a3) {
      expect(String(a.bookingId)).toBe(booking.id);
      expect(String(a.foId)).toBe(fo.id);
    }

    // -------------------------
    // Evidence mode: COUNTS filters
    // -------------------------
    const countsEvBooking = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies/counts?bookingId=${booking.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const dEv1 = countsEvBooking.body?.data;
    expect(dEv1.mode).toBe("evidence");
    expect(Number(dEv1.totalsByType?.INTEGRITY_DISPUTE_STALE ?? 0)).toBeGreaterThanOrEqual(1);

    const countsEvStatus = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies/counts?bookingId=${booking.id}&status=completed`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const dEv2 = countsEvStatus.body?.data;
    expect(dEv2.mode).toBe("evidence");
    expect(Number(dEv2.totalsByType?.INTEGRITY_DISPUTE_STALE ?? 0)).toBeGreaterThanOrEqual(1);

    const countsEvFo = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies/counts?bookingId=${booking.id}&foId=${fo.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const dEv3 = countsEvFo.body?.data;
    expect(dEv3.mode).toBe("evidence");
    expect(Number(dEv3.totalsByType?.INTEGRITY_DISPUTE_STALE ?? 0)).toBeGreaterThanOrEqual(1);

    // -------------------------
    // Rollup mode: LIST filters
    // -------------------------
    const listRollup = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies?groupBy=fingerprint&bookingId=${booking.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const r1 = listRollup.body?.data?.anomalies ?? [];
    expect(r1.length).toBeGreaterThanOrEqual(1);
    for (const r of r1) {
      expect(String(r.bookingId)).toBe(booking.id);
      expect(String(r.fingerprint)).toBeTruthy();
    }

    const listRollupStatus = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies?groupBy=fingerprint&bookingId=${booking.id}&status=completed`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const r2 = listRollupStatus.body?.data?.anomalies ?? [];
    expect(r2.length).toBeGreaterThanOrEqual(1);
    for (const r of r2) {
      expect(String(r.bookingId)).toBe(booking.id);
      expect(String(r.bookingStatus)).toBe("completed");
    }

    const listRollupFo = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies?groupBy=fingerprint&bookingId=${booking.id}&foId=${fo.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const r3 = listRollupFo.body?.data?.anomalies ?? [];
    expect(r3.length).toBeGreaterThanOrEqual(1);
    for (const r of r3) {
      expect(String(r.bookingId)).toBe(booking.id);
      expect(String(r.foId)).toBe(fo.id);
    }

    // -------------------------
    // Rollup mode: COUNTS filters
    // -------------------------
    const countsRuBooking = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies/counts?groupBy=fingerprint&bookingId=${booking.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const dRu1 = countsRuBooking.body?.data;
    expect(dRu1.mode).toBe("rollup");
    expect(dRu1.groupBy).toBe("fingerprint");
    expect(Number(dRu1.totalsByType?.INTEGRITY_DISPUTE_STALE ?? 0)).toBeGreaterThanOrEqual(1);

    const countsRuStatus = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies/counts?groupBy=fingerprint&bookingId=${booking.id}&status=completed`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const dRu2 = countsRuStatus.body?.data;
    expect(dRu2.mode).toBe("rollup");
    expect(Number(dRu2.totalsByType?.INTEGRITY_DISPUTE_STALE ?? 0)).toBeGreaterThanOrEqual(1);

    const countsRuFo = await request(app.getHttpServer())
      .get(`/api/v1/admin/ops/anomalies/counts?groupBy=fingerprint&bookingId=${booking.id}&foId=${fo.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const dRu3 = countsRuFo.body?.data;
    expect(dRu3.mode).toBe("rollup");
    expect(Number(dRu3.totalsByType?.INTEGRITY_DISPUTE_STALE ?? 0)).toBeGreaterThanOrEqual(1);
  }, 20000);
});
