import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(60000);

describe("Dev Playwright admin scenario (E2E)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/dev/playwright/admin-scenario returns 200 with full scenario shape", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/dev/playwright/admin-scenario")
      .expect(200);

    expect(res.body.ok).toBe(true);
    const s = res.body.scenario;
    expect(s).toBeDefined();
    expect(typeof s.adminEmail).toBe("string");
    expect(s.adminEmail.length).toBeGreaterThan(3);
    expect(typeof s.adminPassword).toBe("string");
    expect(s.adminPassword.length).toBeGreaterThan(3);
    expect(typeof s.customerEmail).toBe("string");
    expect(s.customerEmail.length).toBeGreaterThan(3);
    expect(s.customerPassword).toBe(s.adminPassword);
    expect(typeof s.foEmail).toBe("string");
    expect(s.foEmail.length).toBeGreaterThan(3);
    expect(s.foPassword).toBe(s.adminPassword);

    expect(Array.isArray(s.foIds)).toBe(true);
    expect(s.foIds.length).toBeGreaterThanOrEqual(2);
    s.foIds.forEach((id: string) => {
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(5);
    });

    const bids = s.bookingIds;
    expect(bids.pendingDispatch).toBeTruthy();
    expect(bids.hold).toBeTruthy();
    expect(bids.review).toBeTruthy();
    expect(bids.active).toBeTruthy();
    expect(new Set(Object.values(bids)).size).toBe(4);

    expect(s.exceptionId === null || typeof s.exceptionId === "string").toBe(true);
    expect(s.anomalyId === null || typeof s.anomalyId === "string").toBe(true);

    expect(s.dispatchConfig).toBeDefined();
    expect(
      s.dispatchConfig.activeId === null || typeof s.dispatchConfig.activeId === "string",
    ).toBe(true);
    expect(
      s.dispatchConfig.draftId === null || typeof s.dispatchConfig.draftId === "string",
    ).toBe(true);

    const cc = s.commandCenterMutationBookingIds;
    expect(cc).toBeDefined();
    expect(typeof cc.operatorNote).toBe("string");
    expect(typeof cc.hold).toBe("string");
    expect(typeof cc.markReview).toBe("string");
    expect(typeof cc.approve).toBe("string");
    expect(typeof cc.reassign).toBe("string");
    expect(new Set(Object.values(cc)).size).toBe(5);

    expect(s.exceptionId).toBeTruthy();
    expect(s.anomalyId).toBeTruthy();
    expect(s.dispatchConfig.activeId).toBeTruthy();
    expect(s.dispatchConfig.draftId).toBeTruthy();
  });

  it("is idempotent enough for a second call", async () => {
    const a = await request(app.getHttpServer())
      .get("/api/v1/dev/playwright/admin-scenario")
      .expect(200);
    const b = await request(app.getHttpServer())
      .get("/api/v1/dev/playwright/admin-scenario")
      .expect(200);

    expect(a.body.scenario.adminEmail).toBe(b.body.scenario.adminEmail);
    expect(a.body.scenario.bookingIds).toEqual(b.body.scenario.bookingIds);
  });

  it("seeds a deterministic operator note on the exception booking", async () => {
    const prisma = app.get(PrismaService);
    const res = await request(app.getHttpServer())
      .get("/api/v1/dev/playwright/admin-scenario")
      .expect(200);

    const exceptionId = res.body.scenario.exceptionId as string | null;
    expect(exceptionId).toBeTruthy();

    const note = await prisma.dispatchOperatorNote.findFirst({
      where: {
        bookingId: exceptionId!,
        note: { contains: "playwright_admin_scenario_exception_operator_note" },
      },
    });

    expect(note).not.toBeNull();
  });
});
