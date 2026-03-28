import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(40000);

async function seedRunWithFixTrack(
  prisma: PrismaService,
  incidentKey: string,
  recommendedSteps: string[],
) {
  const run = await prisma.systemTestRun.create({
    data: {
      source: "e2e-incident-actions",
      status: "passed",
      totalCount: 1,
      passedCount: 1,
      failedCount: 0,
      skippedCount: 0,
      rawReportJson: {},
    },
  });

  await prisma.systemTestIncidentIndex.create({
    data: {
      incidentKey,
      lastSeenRunId: run.id,
    },
  });

  await prisma.systemTestIncidentFixTrack.create({
    data: {
      incidentKey,
      primaryArea: "ui",
      recommendedStepsJson: recommendedSteps,
      validationStepsJson: ["verify"],
    },
  });

  return { runId: run.id };
}

describe("Admin system-test incident actions (E2E)", () => {
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

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);
    const adminEmail = `admin_st_ia_${Date.now()}@servelink.local`;
    const admin = await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });
    adminUserId = admin.id;

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = loginRes.body?.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it("bootstraps action from fix track on first detail fetch", async () => {
    const suffix = Date.now();
    const incidentKey = `e2e_ia_boot_${suffix}`;
    await seedRunWithFixTrack(prisma, incidentKey, ["step a", "step b"]);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/system-tests/incident-actions/${incidentKey}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.incidentKey).toBe(incidentKey);
    expect(res.body.status).toBe("open");
    expect(res.body.priority).toBe("medium");
    expect(res.body.recommendedSteps).toEqual(["step a", "step b"]);
    expect(res.body.stepExecutions).toHaveLength(2);
    expect(res.body.stepExecutions[0].stepIndex).toBe(0);
    expect(res.body.stepExecutions[0].status).toBe("pending");
    expect(res.body.events.some((e: { type: string }) => e.type === "action_created")).toBe(
      true,
    );

    const action = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    expect(action?.lastSeenRunId).toBeTruthy();
  });

  it("404s when fix track is missing (not bootstrappable)", async () => {
    const incidentKey = `e2e_ia_nofix_${Date.now()}`;
    await request(app.getHttpServer())
      .get(`/api/v1/admin/system-tests/incident-actions/${incidentKey}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
  });

  it("assigns and unassigns owner with timeline events", async () => {
    const incidentKey = `e2e_ia_owner_${Date.now()}`;
    await seedRunWithFixTrack(prisma, incidentKey, ["one"]);

    const ownerEmail = `owner_ia_${Date.now()}@servelink.local`;
    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        passwordHash: await bcrypt.hash("x", 10),
        role: "admin",
      },
    });

    await request(app.getHttpServer())
      .get(`/api/v1/admin/system-tests/incident-actions/${incidentKey}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const assign = await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${incidentKey}/owner`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ownerUserId: owner.id })
      .expect(200);

    expect(assign.body.ownerUserId).toBe(owner.id);
    expect(
      assign.body.events.some(
        (e: { type: string; metadataJson?: { afterOwnerUserId?: string } }) =>
          e.type === "assigned" && e.metadataJson?.afterOwnerUserId === owner.id,
      ),
    ).toBe(true);

    const unassign = await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${incidentKey}/owner`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ownerUserId: null })
      .expect(200);

    expect(unassign.body.ownerUserId).toBeNull();
    expect(
      unassign.body.events.some((e: { type: string }) => e.type === "unassigned"),
    ).toBe(true);
  });

  it("404s when owner user id does not exist", async () => {
    const incidentKey = `e2e_ia_badowner_${Date.now()}`;
    await seedRunWithFixTrack(prisma, incidentKey, ["x"]);
    await request(app.getHttpServer())
      .get(`/api/v1/admin/system-tests/incident-actions/${incidentKey}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${incidentKey}/owner`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ownerUserId: "clxxxxxxxxxxxxxxxxxxxxxxxx" })
      .expect(404);
  });

  it("updates priority and records priority_changed", async () => {
    const incidentKey = `e2e_ia_pri_${Date.now()}`;
    await seedRunWithFixTrack(prisma, incidentKey, ["a"]);
    await request(app.getHttpServer())
      .get(`/api/v1/admin/system-tests/incident-actions/${incidentKey}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${incidentKey}/priority`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ priority: "high" })
      .expect(200);

    expect(res.body.priority).toBe("high");
    expect(
      res.body.events.some(
        (e: { type: string; metadataJson?: { afterPriority?: string } }) =>
          e.type === "priority_changed" && e.metadataJson?.afterPriority === "high",
      ),
    ).toBe(true);
  });

  it("allows valid status transitions and rejects invalid ones", async () => {
    const incidentKey = `e2e_ia_stat_${Date.now()}`;
    await seedRunWithFixTrack(prisma, incidentKey, ["a"]);
    await request(app.getHttpServer())
      .get(`/api/v1/admin/system-tests/incident-actions/${incidentKey}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${incidentKey}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "resolved" })
      .expect(400);

    const ok = await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${incidentKey}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "investigating" })
      .expect(200);

    expect(ok.body.status).toBe("investigating");
    expect(
      ok.body.events.some(
        (e: { type: string; metadataJson?: { reason?: string } }) =>
          e.type === "status_changed" && e.metadataJson?.reason === "manual",
      ),
    ).toBe(true);
  });

  it("adds notes and rejects blank text", async () => {
    const incidentKey = `e2e_ia_note_${Date.now()}`;
    await seedRunWithFixTrack(prisma, incidentKey, ["a"]);
    await request(app.getHttpServer())
      .get(`/api/v1/admin/system-tests/incident-actions/${incidentKey}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/system-tests/incident-actions/${incidentKey}/notes`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ text: "   " })
      .expect(400);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/system-tests/incident-actions/${incidentKey}/notes`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ text: "hello operator" })
      .expect(200);

    expect(res.body.notes.some((n: { text: string }) => n.text === "hello operator")).toBe(
      true,
    );
    const noteEvt = res.body.events.find((e: { type: string }) => e.type === "note_added");
    expect(noteEvt?.metadataJson?.noteId).toBeTruthy();
  });

  it("updates step execution and auto-moves action status", async () => {
    const incidentKey = `e2e_ia_steps_${Date.now()}`;
    await seedRunWithFixTrack(prisma, incidentKey, ["s0", "s1"]);
    await request(app.getHttpServer())
      .get(`/api/v1/admin/system-tests/incident-actions/${incidentKey}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const toFixing = await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${incidentKey}/steps`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ stepIndex: 0, status: "in_progress" })
      .expect(200);

    expect(toFixing.body.status).toBe("fixing");
    const auto1 = toFixing.body.events.find(
      (e: { metadataJson?: { reason?: string } }) =>
        e.metadataJson?.reason === "first_step_in_progress",
    );
    expect(auto1).toBeTruthy();

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${incidentKey}/steps`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ stepIndex: 0, status: "completed" })
      .expect(200);

    const toVal = await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${incidentKey}/steps`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ stepIndex: 1, status: "completed" })
      .expect(200);

    expect(toVal.body.status).toBe("validating");
    const auto2 = toVal.body.events.find(
      (e: { metadataJson?: { reason?: string } }) =>
        e.metadataJson?.reason === "all_steps_completed",
    );
    expect(auto2).toBeTruthy();
  });

  it("404s for missing step index", async () => {
    const incidentKey = `e2e_ia_nostep_${Date.now()}`;
    await seedRunWithFixTrack(prisma, incidentKey, ["only"]);
    await request(app.getHttpServer())
      .get(`/api/v1/admin/system-tests/incident-actions/${incidentKey}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${incidentKey}/steps`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ stepIndex: 9, status: "completed" })
      .expect(404);
  });

  it("lists actions with filters, unresolved first, and step progress", async () => {
    const t = Date.now();
    const prefix = `e2e_ia_sort_${t}`;
    const keyOpen = `${prefix}_open`;
    const keyResolved = `${prefix}_res`;
    await seedRunWithFixTrack(prisma, keyOpen, ["a", "b"]);
    await seedRunWithFixTrack(prisma, keyResolved, ["x"]);

    await request(app.getHttpServer())
      .get(`/api/v1/admin/system-tests/incident-actions/${keyOpen}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/v1/admin/system-tests/incident-actions/${keyResolved}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${keyResolved}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "fixing" })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${keyResolved}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "validating" })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${keyResolved}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "resolved" })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/system-tests/incident-actions/${keyOpen}/owner`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ownerUserId: adminUserId })
      .expect(200);

    const listScoped = await request(app.getHttpServer())
      .get("/api/v1/admin/system-tests/incident-actions")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ search: prefix, limit: 200 })
      .expect(200);

    expect(Array.isArray(listScoped.body.items)).toBe(true);
    expect(typeof listScoped.body.count).toBe("number");
    expect(listScoped.body.count).toBeGreaterThanOrEqual(2);

    const idxOpen = listScoped.body.items.findIndex(
      (x: { incidentKey: string }) => x.incidentKey === keyOpen,
    );
    const idxRes = listScoped.body.items.findIndex(
      (x: { incidentKey: string }) => x.incidentKey === keyResolved,
    );
    expect(idxOpen).toBeGreaterThanOrEqual(0);
    expect(idxRes).toBeGreaterThanOrEqual(0);
    expect(idxOpen).toBeLessThan(idxRes);

    const rowOpen = listScoped.body.items[idxOpen];
    expect(rowOpen.totalSteps).toBe(2);
    expect(rowOpen.completedSteps).toBe(0);
    expect(rowOpen.noteCount).toBe(0);

    const byStatus = await request(app.getHttpServer())
      .get("/api/v1/admin/system-tests/incident-actions")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ search: prefix, status: "open", limit: 200 })
      .expect(200);

    expect(
      byStatus.body.items.some((x: { incidentKey: string }) => x.incidentKey === keyOpen),
    ).toBe(true);
    expect(
      byStatus.body.items.some((x: { incidentKey: string }) => x.incidentKey === keyResolved),
    ).toBe(false);

    const byStatusMulti = await request(app.getHttpServer())
      .get("/api/v1/admin/system-tests/incident-actions")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ search: prefix, status: ["open", "investigating"], limit: 200 })
      .expect(200);

    expect(
      byStatusMulti.body.items.some((x: { incidentKey: string }) => x.incidentKey === keyOpen),
    ).toBe(true);

    const byOwner = await request(app.getHttpServer())
      .get("/api/v1/admin/system-tests/incident-actions")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ search: prefix, ownerUserId: adminUserId, limit: 200 })
      .expect(200);

    expect(
      byOwner.body.items.some((x: { incidentKey: string }) => x.incidentKey === keyOpen),
    ).toBe(true);
  });
});
