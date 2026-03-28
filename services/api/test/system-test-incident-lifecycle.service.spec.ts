import { Test } from "@nestjs/testing";

import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";
import { SystemTestIncidentActionsService } from "../src/modules/system-tests/system-test-incident-actions.service";
import { SystemTestIncidentAutomationService } from "../src/modules/system-tests/system-test-incident-automation.service";
import { SystemTestIncidentLifecycleService } from "../src/modules/system-tests/system-test-incident-lifecycle.service";

jest.setTimeout(60000);

async function createRun(prisma: PrismaService, label: string) {
  return prisma.systemTestRun.create({
    data: {
      source: `lifecycle-spec-${label}`,
      status: "passed",
      totalCount: 1,
      passedCount: 1,
      failedCount: 0,
      skippedCount: 0,
      rawReportJson: {},
    },
  });
}

describe("SystemTestIncidentLifecycleService", () => {
  let prisma: PrismaService;
  let lifecycle: SystemTestIncidentLifecycleService;
  let actions: SystemTestIncidentActionsService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        SystemTestIncidentAutomationService,
        SystemTestIncidentActionsService,
        SystemTestIncidentLifecycleService,
      ],
    }).compile();
    prisma = mod.get(PrismaService);
    lifecycle = mod.get(SystemTestIncidentLifecycleService);
    actions = mod.get(SystemTestIncidentActionsService);
  });

  it("sync from run creates action, sets lastSeenRunId, keeps step rows", async () => {
    const run = await createRun(prisma, "t1");
    const incidentKey = `lc_t1_${Date.now()}`;
    await prisma.systemTestIncidentFixTrack.create({
      data: {
        incidentKey,
        primaryArea: "ui",
        recommendedStepsJson: ["a", "b"],
        validationStepsJson: ["v"],
      },
    });
    await prisma.systemTestIncidentIndex.create({
      data: {
        incidentKey,
        lastSeenRunId: run.id,
        lastSeenGapRuns: 0,
      },
    });

    await lifecycle.syncIncidentActionFromRun({ incidentKey, runId: run.id });

    const action = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    expect(action).toBeTruthy();
    expect(action!.lastSeenRunId).toBe(run.id);
    const stepCount = await prisma.systemTestIncidentStepExecution.count({
      where: { incidentActionId: action!.id },
    });
    expect(stepCount).toBe(2);
    expect(
      await prisma.systemTestIncidentEvent.findFirst({
        where: { incidentKey, type: "incident_seen" },
      }),
    ).toBeTruthy();
  });

  it("resolved incident reappearing in a run reopens to fixing with events", async () => {
    const r1 = await createRun(prisma, "t2a");
    const r2 = await createRun(prisma, "t2b");
    const incidentKey = `lc_t2_${Date.now()}`;
    await prisma.systemTestIncidentFixTrack.create({
      data: {
        incidentKey,
        primaryArea: "ui",
        recommendedStepsJson: ["s"],
        validationStepsJson: ["v"],
      },
    });
    await prisma.systemTestIncidentIndex.create({
      data: { incidentKey, lastSeenRunId: r1.id, lastSeenGapRuns: 0 },
    });
    await lifecycle.syncIncidentActionFromRun({ incidentKey, runId: r1.id });
    await prisma.systemTestIncidentAction.update({
      where: { incidentKey },
      data: { status: "resolved", resolvedAt: new Date() },
    });

    await lifecycle.syncIncidentActionFromRun({ incidentKey, runId: r2.id });

    const action = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    expect(action!.status).toBe("fixing");
    expect(action!.resolvedAt).toBeNull();
    expect(action!.reopenCount).toBe(1);
    expect(action!.reopenedAt).toBeTruthy();
    expect(action!.validationState).toBe("failed");

    const ev = await prisma.systemTestIncidentEvent.findMany({
      where: { incidentKey },
      orderBy: { createdAt: "asc" },
    });
    expect(ev.some((e) => e.type === "reopened")).toBe(true);
    expect(
      ev.some(
        (e) =>
          e.type === "status_changed" &&
          (e.metadataJson as { reason?: string })?.reason ===
            "auto_reopened_on_reappearance",
      ),
    ).toBe(true);
  });

  it("dismissed incident reappearing stays dismissed and only updates lastSeenRunId", async () => {
    const r1 = await createRun(prisma, "t3a");
    const r2 = await createRun(prisma, "t3b");
    const incidentKey = `lc_t3_${Date.now()}`;
    await prisma.systemTestIncidentFixTrack.create({
      data: {
        incidentKey,
        primaryArea: "ui",
        recommendedStepsJson: ["s"],
        validationStepsJson: ["v"],
      },
    });
    await prisma.systemTestIncidentIndex.create({
      data: { incidentKey, lastSeenRunId: r1.id, lastSeenGapRuns: 0 },
    });
    await lifecycle.syncIncidentActionFromRun({ incidentKey, runId: r1.id });
    await prisma.systemTestIncidentAction.update({
      where: { incidentKey },
      data: { status: "dismissed" },
    });

    await lifecycle.syncIncidentActionFromRun({ incidentKey, runId: r2.id });

    const action = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    expect(action!.status).toBe("dismissed");
    expect(action!.lastSeenRunId).toBe(r2.id);
    expect(action!.reopenCount).toBe(0);
  });

  it("resolved incident absent with gap passes validation", async () => {
    const rOld = await createRun(prisma, "t4old");
    const rNew = await createRun(prisma, "t4new");
    const incidentKey = `lc_t4_${Date.now()}`;
    await prisma.systemTestIncidentFixTrack.create({
      data: {
        incidentKey,
        primaryArea: "ui",
        recommendedStepsJson: ["s"],
        validationStepsJson: ["v"],
      },
    });
    await prisma.systemTestIncidentIndex.create({
      data: {
        incidentKey,
        lastSeenRunId: rOld.id,
        lastSeenGapRuns: 1,
      },
    });
    await prisma.systemTestIncidentAction.create({
      data: {
        incidentKey,
        status: "resolved",
        priority: "medium",
        resolvedAt: new Date(),
        lastSeenRunId: rOld.id,
      },
    });

    const result = await lifecycle.evaluateResolvedAction(incidentKey, rNew.id);
    expect(result.passed).toBe(true);
    expect(result.reason).toBe("still_absent");

    await lifecycle.evaluateResolvedActionsAfterRun({ runId: rNew.id });

    const action = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    expect(action!.status).toBe("resolved");
    expect(action!.validationState).toBe("passed");
    expect(action!.validationLastPassedAt).toBeTruthy();

    const ev = await prisma.systemTestIncidentEvent.findFirst({
      where: { incidentKey, type: "validation_passed" },
    });
    expect(ev).toBeTruthy();
  });

  it("resolved incident in latest run fails validation and reopens", async () => {
    const run = await createRun(prisma, "t5");
    const incidentKey = `lc_t5_${Date.now()}`;
    await prisma.systemTestIncidentFixTrack.create({
      data: {
        incidentKey,
        primaryArea: "ui",
        recommendedStepsJson: ["s"],
        validationStepsJson: ["v"],
      },
    });
    await prisma.systemTestIncident.create({
      data: {
        runId: run.id,
        incidentKey,
        incidentVersion: "v1",
        displayTitle: "t",
        rootCauseCategory: "x",
        summary: "s",
        severity: "high",
        status: "open",
      },
    });
    await prisma.systemTestIncidentAction.create({
      data: {
        incidentKey,
        status: "resolved",
        priority: "medium",
        resolvedAt: new Date(),
        lastSeenRunId: run.id,
      },
    });

    const result = await lifecycle.evaluateResolvedAction(incidentKey, run.id);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe("reappeared_in_latest_run");

    await lifecycle.evaluateResolvedActionsAfterRun({ runId: run.id });

    const action = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    expect(action!.status).toBe("fixing");
    expect(
      await prisma.systemTestIncidentEvent.findFirst({
        where: { incidentKey, type: "validation_failed" },
      }),
    ).toBeTruthy();
    expect(
      await prisma.systemTestIncidentEvent.findFirst({
        where: { incidentKey, type: "reopened" },
      }),
    ).toBeTruthy();
  });

  it("resolved incident fails insufficient_history and reopens", async () => {
    const run = await createRun(prisma, "t6");
    const incidentKey = `lc_t6_${Date.now()}`;
    await prisma.systemTestIncidentFixTrack.create({
      data: {
        incidentKey,
        primaryArea: "ui",
        recommendedStepsJson: ["s"],
        validationStepsJson: ["v"],
      },
    });
    await prisma.systemTestIncidentIndex.upsert({
      where: { incidentKey },
      create: {
        incidentKey,
        lastSeenRunId: run.id,
        lastSeenGapRuns: 0,
      },
      update: {
        lastSeenRunId: run.id,
        lastSeenGapRuns: 0,
      },
    });
    await prisma.systemTestIncidentAction.create({
      data: {
        incidentKey,
        status: "resolved",
        priority: "medium",
        resolvedAt: new Date(),
        lastSeenRunId: run.id,
      },
    });

    const result = await lifecycle.evaluateResolvedAction(incidentKey, run.id);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe("insufficient_history");

    await lifecycle.evaluateResolvedActionsAfterRun({ runId: run.id });

    const action = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    expect(action!.status).toBe("fixing");
  });

  it("listActions needsValidation includes resolved without passed and excludes others", async () => {
    const t = Date.now();
    const kNull = `lc_nv_null_${t}`;
    const kFailed = `lc_nv_fail_${t}`;
    const kPassed = `lc_nv_pass_${t}`;
    const kOpen = `lc_nv_open_${t}`;

    await prisma.systemTestIncidentAction.createMany({
      data: [
        {
          incidentKey: kNull,
          status: "resolved",
          priority: "medium",
          resolvedAt: new Date(),
          validationState: null,
        },
        {
          incidentKey: kFailed,
          status: "resolved",
          priority: "medium",
          resolvedAt: new Date(),
          validationState: "failed",
        },
        {
          incidentKey: kPassed,
          status: "resolved",
          priority: "medium",
          resolvedAt: new Date(),
          validationState: "passed",
        },
        {
          incidentKey: kOpen,
          status: "open",
          priority: "medium",
        },
      ],
    });

    const list = await actions.listActions({
      needsValidation: true,
      search: `lc_nv_`,
      limit: 200,
    });

    const keys = list.items.map((i) => i.incidentKey);
    expect(keys).toContain(kNull);
    expect(keys).toContain(kFailed);
    expect(keys).not.toContain(kPassed);
    expect(keys).not.toContain(kOpen);
  });
});
