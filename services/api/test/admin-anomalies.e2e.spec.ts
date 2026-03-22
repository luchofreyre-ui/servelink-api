import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import {
  OpsAnomalyStatus,
  OpsAnomalyType,
  Role,
} from "@prisma/client";

jest.setTimeout(25000);

describe("Admin anomalies (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const passwordHash = await bcrypt.hash("test-password", 10);
    const adminEmail = `admin_anom_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: Role.admin },
    });

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: "test-password" })
      .expect(201);

    adminToken = login.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  it("open anomalies endpoint returns created anomaly", async () => {
    const row = await prisma.opsAnomaly.create({
      data: {
        type: OpsAnomalyType.payment_missing,
        status: OpsAnomalyStatus.open,
        title: "E2E test anomaly",
        detail: "detail",
      },
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/anomalies")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const list = res.body as { id: string }[];
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((x) => x.id === row.id)).toBe(true);
  });

  it("ack changes status to acknowledged", async () => {
    const row = await prisma.opsAnomaly.create({
      data: {
        type: OpsAnomalyType.dispatch_failed,
        status: OpsAnomalyStatus.open,
        title: "Ack test",
      },
    });

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/anomalies/${row.id}/ack`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const updated = await prisma.opsAnomaly.findUnique({
      where: { id: row.id },
    });
    expect(updated?.status).toBe(OpsAnomalyStatus.acknowledged);
  });

  it("resolve sets resolved and resolvedAt", async () => {
    const row = await prisma.opsAnomaly.create({
      data: {
        type: OpsAnomalyType.payment_mismatch,
        status: OpsAnomalyStatus.open,
        title: "Resolve test",
      },
    });

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/anomalies/${row.id}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const updated = await prisma.opsAnomaly.findUnique({
      where: { id: row.id },
    });
    expect(updated?.status).toBe(OpsAnomalyStatus.resolved);
    expect(updated?.resolvedAt).toBeTruthy();
  });
});
