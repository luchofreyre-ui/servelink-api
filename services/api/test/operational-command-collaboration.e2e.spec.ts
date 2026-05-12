import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

describe("Operational command collaboration (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin1Token: string;
  let admin2Token: string;
  let admin2Email: string;

  const password = "test-password";
  const base = "/api/v1/admin/operational-command-collaboration";

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = Date.now();

    const email1 = `admin_collab_a_${ts}@servelink.local`;
    const u1 = await prisma.user.create({
      data: { email: email1, passwordHash, role: "admin" },
    });
    void u1;

    const email2 = `admin_collab_b_${ts}@servelink.local`;
    const u2 = await prisma.user.create({
      data: { email: email2, passwordHash, role: "admin" },
    });
    void u2;
    admin2Email = email2;

    const login1 = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: email1, password })
      .expect(201);
    admin1Token = login1.body?.accessToken;
    expect(admin1Token).toBeTruthy();

    const login2 = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: email2, password })
      .expect(201);
    admin2Token = login2.body?.accessToken;
    expect(admin2Token).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates and lists server-backed workspaces", async () => {
    const created = await request(app.getHttpServer())
      .post(`${base}/workspaces`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .send({
        title: "Mega Phase D workspace",
        notes: "coordination note",
      })
      .expect(201);

    expect(created.body?.ok).toBe(true);
    const wid = created.body?.workspace?.id as string;
    expect(wid).toBeTruthy();

    const listed = await request(app.getHttpServer())
      .get(`${base}/workspaces`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .expect(200);

    expect(listed.body?.ok).toBe(true);
    expect(
      Array.isArray(listed.body?.workspaces) &&
        listed.body.workspaces.some((w: { id: string }) => w.id === wid),
    ).toBe(true);

    const timeline = await request(app.getHttpServer())
      .get(`${base}/workspaces/${wid}/timeline`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .expect(200);

    expect(timeline.body?.ok).toBe(true);
    expect(Array.isArray(timeline.body?.timeline)).toBe(true);
  });

  it("shares workspace with another admin and allows collaborator edits", async () => {
    const created = await request(app.getHttpServer())
      .post(`${base}/workspaces`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .send({ title: "Shared workspace" })
      .expect(201);

    const wid = created.body?.workspace?.id as string;

    await request(app.getHttpServer())
      .get(`${base}/workspaces`)
      .set("Authorization", `Bearer ${admin2Token}`)
      .expect(200)
      .expect((res) => {
        expect(
          res.body?.workspaces?.some((w: { id: string }) => w.id === wid),
        ).toBe(false);
      });

    await request(app.getHttpServer())
      .post(`${base}/workspaces/${wid}/share`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .send({ email: admin2Email })
      .expect(201);

    const patched = await request(app.getHttpServer())
      .patch(`${base}/workspaces/${wid}`)
      .set("Authorization", `Bearer ${admin2Token}`)
      .send({ notes: "collaborator-authored" })
      .expect(200);

    expect(patched.body?.workspace?.notes).toBe("collaborator-authored");

    await request(app.getHttpServer())
      .delete(`${base}/workspaces/${wid}`)
      .set("Authorization", `Bearer ${admin2Token}`)
      .expect(403);
  });

  it("creates replay review sessions and comments", async () => {
    const sessionRes = await request(app.getHttpServer())
      .post(`${base}/replay-review/sessions`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .send({
        title: "Review thread",
        replaySessionIdPrimary: "sess_a",
        replaySessionIdCompare: "sess_b",
      })
      .expect(201);

    const sid = sessionRes.body?.session?.id as string;
    expect(sid).toBeTruthy();

    await request(app.getHttpServer())
      .post(`${base}/replay-review/sessions/${sid}/comments`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .send({
        body: "Human commentary — not warehouse truth.",
        anchorKind: "chronology_delta",
      })
      .expect(201);

    const comments = await request(app.getHttpServer())
      .get(`${base}/replay-review/sessions/${sid}/comments`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .expect(200);

    expect(comments.body?.comments?.length).toBeGreaterThanOrEqual(1);
  });

  const presenceBase = "/api/v1/admin/operational-command-presence";

  it("records operational presence heartbeat and snapshots operators", async () => {
    await request(app.getHttpServer())
      .post(`${presenceBase}/heartbeat`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .send({
        surface: "command_center",
      })
      .expect(201);

    const snap = await request(app.getHttpServer())
      .get(`${presenceBase}/snapshot`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .expect(200);

    expect(snap.body?.ok).toBe(true);
    expect(Array.isArray(snap.body?.operators)).toBe(true);
    expect(snap.body?.operators?.length).toBeGreaterThanOrEqual(1);
  });

  it("stores collaborative graph annotations", async () => {
    await request(app.getHttpServer())
      .post(`${presenceBase}/graph-annotations`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .send({
        graphNodeId: "phase_f_graph_node_fixture",
        body: "Human coordination note",
      })
      .expect(201);

    const listed = await request(app.getHttpServer())
      .get(
        `${presenceBase}/graph-annotations?graphNodeId=${encodeURIComponent(
          "phase_f_graph_node_fixture",
        )}`,
      )
      .set("Authorization", `Bearer ${admin1Token}`)
      .expect(200);

    expect(listed.body?.annotations?.length).toBeGreaterThanOrEqual(1);
  });

  it("appends Phase F team continuity markers", async () => {
    const created = await request(app.getHttpServer())
      .post(`${base}/workspaces`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .send({ title: "Continuity workspace" })
      .expect(201);

    const wid = created.body?.workspace?.id as string;
    expect(wid).toBeTruthy();

    await request(app.getHttpServer())
      .post(`${base}/workspaces/${wid}/phase-f-continuity-markers`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .send({
        markerKind: "handoff_snapshot",
        summary: "Shift handoff narrative",
      })
      .expect(201);

    const tl = await request(app.getHttpServer())
      .get(`${base}/workspaces/${wid}/timeline`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .expect(200);

    expect(
      tl.body?.timeline?.some(
        (ev: { eventKind?: string }) =>
          ev.eventKind === "phase_f_team_continuity_marker",
      ),
    ).toBe(true);
  });
});
