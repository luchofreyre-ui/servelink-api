import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { ProviderResolverService } from "../src/modules/fo/provider-resolver.service";

describe("FO provider links + readiness integrity (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let providerResolver: ProviderResolverService;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    providerResolver = app.get(ProviderResolverService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns provider linkage rows and summary", async () => {
    const stamp = Date.now();

    const user = await prisma.user.create({
      data: {
        email: `fo-provider-links-${stamp}@example.com`,
        phone: `+1555${String(stamp).slice(-7)}`,
        passwordHash: "hash",
        role: "fo",
      },
    });

    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: user.id,
        status: "active",
        displayName: "Provider Read Target",
      },
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/franchise-owners/provider-links")
      .query({ limit: 5000 })
      .expect(200);

    expect(res.body).toBeTruthy();
    expect(res.body.summary).toBeTruthy();
    expect(Array.isArray(res.body.rows)).toBe(true);

    const row = (res.body.rows as any[]).find((r) => r.foId === fo.id);
    expect(row).toBeTruthy();
    expect(row.providerId).toBeTruthy();
    expect(row.providerUserId).toBe(user.id);
    expect(row.isLinked).toBe(true);
    expect(row.isConsistent).toBe(true);
    expect(row.issueCode).toBeNull();
  });

  it("returns a single FO provider linkage record", async () => {
    const stamp = Date.now();

    const user = await prisma.user.create({
      data: {
        email: `fo-provider-link-single-${stamp}@example.com`,
        phone: `+1666${String(stamp).slice(-7)}`,
        passwordHash: "hash",
        role: "fo",
      },
    });

    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: user.id,
        status: "active",
        displayName: "Single Provider Lookup",
      },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/franchise-owners/${fo.id}/provider-link`)
      .expect(200);

    expect(res.body.foId).toBe(fo.id);
    expect(res.body.providerId).toBeTruthy();
    expect(res.body.providerUserId).toBe(user.id);
    expect(res.body.isLinked).toBe(true);
    expect(res.body.isConsistent).toBe(true);
    expect(res.body.issueCode).toBeNull();
  });

  it("provider resolver returns a healthy link for a newly created FO", async () => {
    const stamp = Date.now();

    const user = await prisma.user.create({
      data: {
        email: `fo-provider-resolver-healthy-${stamp}@example.com`,
        phone: `+1999${String(stamp).slice(-7)}`,
        passwordHash: "hash",
        role: "fo",
      },
    });

    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: user.id,
        status: "active",
        displayName: "Resolver Healthy Target",
      },
    });

    const record = await providerResolver.resolveFoProviderLink(fo.id);

    expect(record.foId).toBe(fo.id);
    expect(record.foUserId).toBe(user.id);
    expect(record.providerId).toBeTruthy();
    expect(record.providerUserId).toBe(user.id);
    expect(record.isLinked).toBe(true);
    expect(record.isConsistent).toBe(true);
    expect(record.issueCode).toBeNull();
  });

  it("ready fails when FO provider linkage is inconsistent", async () => {
    const stamp = Date.now();

    const userA = await prisma.user.create({
      data: {
        email: `fo-provider-broken-a-${stamp}@example.com`,
        phone: `+1777${String(stamp).slice(-7)}`,
        passwordHash: "hash",
        role: "fo",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: `fo-provider-broken-b-${stamp}@example.com`,
        phone: `+1888${String(stamp).slice(-7)}`,
        passwordHash: "hash",
        role: "fo",
      },
    });

    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: userA.id,
        status: "active",
        displayName: "Broken Readiness Target",
      },
    });

    const mismatchedProvider = await prisma.serviceProvider.create({
      data: {
        userId: userB.id,
        type: "franchise_owner",
        status: "active",
        displayName: "Mismatched Provider",
      },
    });

    await prisma.$executeRawUnsafe(
      `UPDATE "FranchiseOwner" SET "providerId" = $1 WHERE "id" = $2`,
      mismatchedProvider.id,
      fo.id,
    );

    const res = await request(app.getHttpServer())
      .get("/api/v1/ready")
      .expect(503);

    expect(res.body.status).toBe("not_ready");
    expect(res.body.db).toBe("ok");
    expect(res.body.providerIntegrity).toBeTruthy();
    expect(res.body.providerIntegrity.healthy).toBe(false);
    expect(res.body.providerIntegrity.userMismatch).toBeGreaterThan(0);
  });
});
