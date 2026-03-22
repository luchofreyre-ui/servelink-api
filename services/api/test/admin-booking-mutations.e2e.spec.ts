import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { randomUUID } from "crypto";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(60000);

describe("Admin booking command center mutations (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function scenarioAuth() {
    const scenarioRes = await request(app.getHttpServer())
      .get("/api/v1/dev/playwright/admin-scenario")
      .expect(200);

    const adminEmail = scenarioRes.body.scenario.adminEmail as string;
    const adminPassword = scenarioRes.body.scenario.adminPassword as string;

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);

    const token = loginRes.body?.accessToken as string;
    expect(token).toBeTruthy();

    return { token, scenario: scenarioRes.body.scenario };
  }

  it("PATCH operator note persists, returns payload, and writes activity", async () => {
    const { token, scenario } = await scenarioAuth();
    const bookingId = scenario.commandCenterMutationBookingIds.operatorNote as string;

    const patch = await request(app.getHttpServer())
      .patch(`/api/v1/admin/bookings/${bookingId}/operator-note`)
      .set("Authorization", `Bearer ${token}`)
      .send({ note: "e2e_operator_note_mutation" })
      .expect(200);

    expect(patch.body.operatorNote).toBe("e2e_operator_note_mutation");
    expect(patch.body.activityPreview.some((r: { type: string }) => r.type === "admin_operator_note_saved")).toBe(
      true,
    );

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/admin/bookings/${bookingId}/command-center`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(detail.body.operatorNote).toBe("e2e_operator_note_mutation");

    const row = await prisma.adminCommandCenterActivity.findFirst({
      where: { bookingId, type: "admin_operator_note_saved" },
    });
    expect(row).not.toBeNull();
  });

  it("POST hold sets held workflow and activity", async () => {
    const { token, scenario } = await scenarioAuth();
    const bookingId = scenario.commandCenterMutationBookingIds.hold as string;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${bookingId}/hold`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.workflowState).toBe("held");

    const row = await prisma.adminCommandCenterActivity.findFirst({
      where: { bookingId, type: "admin_booking_held" },
    });
    expect(row).not.toBeNull();
  });

  it("POST review sets in_review workflow, anomaly payload, and activity", async () => {
    const { token, scenario } = await scenarioAuth();
    const bookingId = scenario.commandCenterMutationBookingIds.markReview as string;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${bookingId}/review`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.workflowState).toBe("in_review");

    const alert = await prisma.opsAlert.findFirst({
      where: { bookingId },
      orderBy: { updatedAt: "desc" },
    });
    expect(alert).not.toBeNull();
    const payload = JSON.parse(alert!.payloadJson ?? "{}");
    expect(payload.adminReviewState).toBe("in_review");

    const row = await prisma.adminCommandCenterActivity.findFirst({
      where: { bookingId, type: "admin_booking_marked_in_review" },
    });
    expect(row).not.toBeNull();
  });

  it("POST approve sets approved workflow, acks anomaly, and activity", async () => {
    const { token, scenario } = await scenarioAuth();
    const bookingId = scenario.commandCenterMutationBookingIds.approve as string;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${bookingId}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.workflowState).toBe("approved");

    const alert = await prisma.opsAlert.findFirst({
      where: { bookingId },
      orderBy: { updatedAt: "desc" },
    });
    expect(alert?.status).toBe("acked");
    expect(alert?.resolvedAt).not.toBeNull();
    const payload = JSON.parse(alert?.payloadJson ?? "{}");
    expect(payload.adminReviewState).toBe("approved");

    const row = await prisma.adminCommandCenterActivity.findFirst({
      where: { bookingId, type: "admin_booking_approved" },
    });
    expect(row).not.toBeNull();
  });

  it("POST reassign returns booking to pending_dispatch and writes activity", async () => {
    const { token, scenario } = await scenarioAuth();
    const bookingId = scenario.commandCenterMutationBookingIds.reassign as string;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${bookingId}/reassign`)
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(200);

    expect(res.body.status).toBe("pending_dispatch");
    expect(res.body.workflowState).toBe("reassign_requested");

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(booking?.status).toBe("pending_dispatch");
    expect(booking?.foId).toBeNull();

    const row = await prisma.adminCommandCenterActivity.findFirst({
      where: { bookingId, type: "admin_booking_reassign_requested" },
    });
    expect(row).not.toBeNull();
  });

  it("rejects invalid transitions and payloads", async () => {
    const { token, scenario } = await scenarioAuth();
    const bookingId = scenario.commandCenterMutationBookingIds.hold as string;

    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${bookingId}/hold`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${bookingId}/hold`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/bookings/${randomUUID()}/operator-note`)
      .set("Authorization", `Bearer ${token}`)
      .send({ note: "x" })
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/bookings/${bookingId}/operator-note`)
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${bookingId}/reassign`)
      .set("Authorization", `Bearer ${token}`)
      .send({ targetFoId: "any" })
      .expect(400);
  });
});
