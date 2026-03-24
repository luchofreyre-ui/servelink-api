import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { DeepCleanEstimatorConfigStatus } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { DEFAULT_DEEP_CLEAN_ESTIMATOR_CONFIG } from "../src/modules/bookings/deep-clean-estimator-config.types";

jest.setTimeout(90000);

function cfgJson(over: Partial<typeof DEFAULT_DEEP_CLEAN_ESTIMATOR_CONFIG> = {}) {
  return JSON.stringify({ ...DEFAULT_DEEP_CLEAN_ESTIMATOR_CONFIG, ...over });
}

describe("Deep clean estimator governance (E2E)", () => {
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
    await prisma.deepCleanEstimatorConfig.deleteMany({});

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);
    const adminEmail = `admin_dc_gov_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = login.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  it("Case 1 — history: active, draft, archived ordered correctly", async () => {
    await prisma.deepCleanEstimatorConfig.createMany({
      data: [
        {
          version: 5,
          status: DeepCleanEstimatorConfigStatus.archived,
          label: "old-a",
          configJson: cfgJson({ globalDurationMultiplier: 1 }),
          publishedAt: new Date("2020-01-01"),
        },
        {
          version: 6,
          status: DeepCleanEstimatorConfigStatus.archived,
          label: "old-b",
          configJson: cfgJson({ globalDurationMultiplier: 1.05 }),
          publishedAt: new Date("2020-02-01"),
        },
        {
          version: 7,
          status: DeepCleanEstimatorConfigStatus.active,
          label: "current-active",
          configJson: cfgJson({ globalDurationMultiplier: 1.1 }),
          publishedAt: new Date("2020-03-01"),
        },
        {
          version: 8,
          status: DeepCleanEstimatorConfigStatus.draft,
          label: "current-draft",
          configJson: cfgJson({ globalDurationMultiplier: 1.15 }),
        },
      ],
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/deep-clean/estimator-config/history")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body?.kind).toBe("deep_clean_estimator_config_history");
    const rows = res.body?.rows as Array<{ version: number; status: string }>;
    expect(rows.map((r) => r.version)).toEqual([7, 8, 6, 5]);
    expect(rows.map((r) => r.status)).toEqual(["active", "draft", "archived", "archived"]);
  });

  it("Case 2 — detail returns config by id", async () => {
    await prisma.deepCleanEstimatorConfig.deleteMany({});
    const row = await prisma.deepCleanEstimatorConfig.create({
      data: {
        version: 1,
        status: DeepCleanEstimatorConfigStatus.active,
        label: "L1",
        configJson: cfgJson({ globalDurationMultiplier: 1.33 }),
        publishedAt: new Date(),
      },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/deep-clean/estimator-config/${row.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body?.kind).toBe("deep_clean_estimator_config_detail");
    expect(res.body?.row?.version).toBe(1);
    expect(res.body?.row?.config?.globalDurationMultiplier).toBe(1.33);
  });

  it("Case 3 — restore archived to draft: draft updated, source unchanged", async () => {
    await prisma.deepCleanEstimatorConfig.deleteMany({});
    const archived = await prisma.deepCleanEstimatorConfig.create({
      data: {
        version: 1,
        status: DeepCleanEstimatorConfigStatus.archived,
        label: "archived-v1",
        configJson: cfgJson({ globalDurationMultiplier: 0.9 }),
        publishedAt: new Date(),
      },
    });
    const draft = await prisma.deepCleanEstimatorConfig.create({
      data: {
        version: 2,
        status: DeepCleanEstimatorConfigStatus.draft,
        label: "old draft",
        configJson: cfgJson({ globalDurationMultiplier: 1.2 }),
      },
    });

    const restore = await request(app.getHttpServer())
      .post(`/api/v1/admin/deep-clean/estimator-config/${archived.id}/restore-to-draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(restore.body?.kind).toBe("deep_clean_estimator_config_restored_to_draft");
    expect(restore.body?.restoredFromVersion).toBe(1);
    expect(restore.body?.draft?.label).toBe("Restored from v1");
    expect(restore.body?.draft?.config?.globalDurationMultiplier).toBe(0.9);

    const archAfter = await prisma.deepCleanEstimatorConfig.findUnique({
      where: { id: archived.id },
    });
    expect(archAfter?.label).toBe("archived-v1");
    expect(JSON.parse(archAfter?.configJson ?? "{}").globalDurationMultiplier).toBe(0.9);

    const draftAfter = await prisma.deepCleanEstimatorConfig.findUnique({ where: { id: draft.id } });
    expect(draftAfter?.id).toBe(draft.id);
    expect(draftAfter?.version).toBe(2);
    expect(JSON.parse(draftAfter?.configJson ?? "{}").globalDurationMultiplier).toBe(0.9);
  });

  it("Case 4 — restore active to draft: active unchanged", async () => {
    await prisma.deepCleanEstimatorConfig.deleteMany({});
    const active = await prisma.deepCleanEstimatorConfig.create({
      data: {
        version: 10,
        status: DeepCleanEstimatorConfigStatus.active,
        label: "active-x",
        configJson: cfgJson({ globalDurationMultiplier: 1.44 }),
        publishedAt: new Date(),
      },
    });
    const draft = await prisma.deepCleanEstimatorConfig.create({
      data: {
        version: 11,
        status: DeepCleanEstimatorConfigStatus.draft,
        label: "draft-y",
        configJson: cfgJson({ globalDurationMultiplier: 1 }),
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/admin/deep-clean/estimator-config/${active.id}/restore-to-draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const activeAfter = await prisma.deepCleanEstimatorConfig.findUnique({ where: { id: active.id } });
    expect(activeAfter?.label).toBe("active-x");
    expect(JSON.parse(activeAfter?.configJson ?? "{}").globalDurationMultiplier).toBe(1.44);

    const draftAfter = await prisma.deepCleanEstimatorConfig.findUnique({ where: { id: draft.id } });
    expect(JSON.parse(draftAfter?.configJson ?? "{}").globalDurationMultiplier).toBe(1.44);
    expect(draftAfter?.label).toBe("Restored from v10");
  });

  it("Case 5 — publish restored draft creates new active version; old rows not reactivated", async () => {
    await prisma.deepCleanEstimatorConfig.deleteMany({});
    const v1 = await prisma.deepCleanEstimatorConfig.create({
      data: {
        version: 1,
        status: DeepCleanEstimatorConfigStatus.archived,
        label: "v1-arch",
        configJson: cfgJson({ globalDurationMultiplier: 1.01 }),
        publishedAt: new Date(),
      },
    });
    const v2 = await prisma.deepCleanEstimatorConfig.create({
      data: {
        version: 2,
        status: DeepCleanEstimatorConfigStatus.active,
        label: "v2-active",
        configJson: cfgJson({ globalDurationMultiplier: 1.02 }),
        publishedAt: new Date(),
      },
    });
    const v3 = await prisma.deepCleanEstimatorConfig.create({
      data: {
        version: 3,
        status: DeepCleanEstimatorConfigStatus.draft,
        label: "v3-draft",
        configJson: cfgJson({ globalDurationMultiplier: 1.03 }),
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/admin/deep-clean/estimator-config/${v1.id}/restore-to-draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const pub = await request(app.getHttpServer())
      .post("/api/v1/admin/deep-clean/estimator-config/publish")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(pub.body?.kind).toBe("deep_clean_estimator_config_published");
    const publishedVersion = pub.body?.published?.version as number;
    expect(publishedVersion).toBe(3);

    const v1Row = await prisma.deepCleanEstimatorConfig.findUnique({ where: { id: v1.id } });
    const v2Row = await prisma.deepCleanEstimatorConfig.findUnique({ where: { id: v2.id } });
    const v3Row = await prisma.deepCleanEstimatorConfig.findUnique({ where: { id: v3.id } });

    expect(v1Row?.status).toBe(DeepCleanEstimatorConfigStatus.archived);
    expect(v2Row?.status).toBe(DeepCleanEstimatorConfigStatus.archived);
    expect(v3Row?.status).toBe(DeepCleanEstimatorConfigStatus.active);

    const newDraft = await prisma.deepCleanEstimatorConfig.findFirst({
      where: { status: DeepCleanEstimatorConfigStatus.draft },
      orderBy: { version: "desc" },
    });
    expect(newDraft?.version).toBe(4);
  });

  it("Case 6 — invalid id returns 404", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/deep-clean/estimator-config/cmj999invalididxxx")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
    expect(String(res.body?.message ?? res.text)).toMatch(/not found|NOT_FOUND/i);

    const res2 = await request(app.getHttpServer())
      .post("/api/v1/admin/deep-clean/estimator-config/cmj999invalididxxx/restore-to-draft")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
    expect(String(res2.body?.message ?? res2.text)).toMatch(/not found|NOT_FOUND/i);
  });

  it("Case 7 — cannot restore from draft", async () => {
    await prisma.deepCleanEstimatorConfig.deleteMany({});
    await prisma.deepCleanEstimatorConfig.create({
      data: {
        version: 1,
        status: DeepCleanEstimatorConfigStatus.active,
        label: "a",
        configJson: cfgJson(),
        publishedAt: new Date(),
      },
    });
    const d = await prisma.deepCleanEstimatorConfig.create({
      data: {
        version: 2,
        status: DeepCleanEstimatorConfigStatus.draft,
        label: "d",
        configJson: cfgJson(),
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/admin/deep-clean/estimator-config/${d.id}/restore-to-draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);
  });
});
