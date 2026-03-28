import { Test } from "@nestjs/testing";

import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";
import { SystemTestIncidentActionsService } from "../src/modules/system-tests/system-test-incident-actions.service";
import { SystemTestIncidentAutomationService } from "../src/modules/system-tests/system-test-incident-automation.service";

jest.setTimeout(120_000);

async function createRun(prisma: PrismaService, label: string) {
  return prisma.systemTestRun.create({
    data: {
      source: `automation-spec-${label}`,
      status: "passed",
      totalCount: 1,
      passedCount: 1,
      failedCount: 0,
      skippedCount: 0,
      rawReportJson: {},
    },
  });
}

describe("SystemTestIncidentAutomationService", () => {
  let prisma: PrismaService;
  let automation: SystemTestIncidentAutomationService;
  let actions: SystemTestIncidentActionsService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        SystemTestIncidentAutomationService,
        SystemTestIncidentActionsService,
      ],
    }).compile();
    prisma = mod.get(PrismaService);
    automation = mod.get(SystemTestIncidentAutomationService);
    actions = mod.get(SystemTestIncidentActionsService);
  });

  async function seedAction(incidentKey: string, runId: string) {
    await prisma.systemTestIncidentFixTrack.create({
      data: {
        incidentKey,
        primaryArea: "ui",
        recommendedStepsJson: ["a"],
        validationStepsJson: ["v"],
      },
    });
    await prisma.systemTestIncidentIndex.create({
      data: { incidentKey, lastSeenRunId: runId, lastSeenGapRuns: 0 },
    });
    await actions.ensureActionForIncidentKey({ incidentKey });
  }

  it("initializes SLA for active action from priority", async () => {
    const run = await createRun(prisma, "sla-init");
    const incidentKey = `sla_init_${Date.now()}`;
    await seedAction(incidentKey, run.id);

    await prisma.systemTestIncidentAction.update({
      where: { incidentKey },
      data: { priority: "critical" },
    });

    await automation.syncActionSlaState({ incidentKey });

    const row = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    expect(row!.slaPolicyHours).toBe(4);
    expect(row!.slaStartedAt).toBeTruthy();
    expect(row!.slaDueAt).toBeTruthy();
    expect(["on_track", "due_soon", "overdue"]).toContain(row!.slaStatus);

    const started = await prisma.systemTestIncidentEvent.findFirst({
      where: { incidentKey, type: "sla_started" },
    });
    expect(started).toBeTruthy();
  });

  it("clears SLA timing for resolved action", async () => {
    const run = await createRun(prisma, "sla-resolved");
    const incidentKey = `sla_res_${Date.now()}`;
    await seedAction(incidentKey, run.id);

    await automation.syncActionSlaState({ incidentKey });
    await prisma.systemTestIncidentAction.update({
      where: { incidentKey },
      data: { status: "resolved", resolvedAt: new Date() },
    });
    await automation.syncActionSlaState({ incidentKey });

    const row = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    expect(row!.slaStatus).toBe("completed");
    expect(row!.slaPolicyHours).toBeNull();
    expect(row!.slaDueAt).toBeNull();
  });

  it("emits due-soon once (deduped)", async () => {
    const run = await createRun(prisma, "due-soon");
    const incidentKey = `due_soon_${Date.now()}`;
    await seedAction(incidentKey, run.id);

    const created = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    const start = new Date(created!.createdAt.getTime() - 3.5 * 60 * 60 * 1000);
    await prisma.systemTestIncidentAction.update({
      where: { incidentKey },
      data: {
        priority: "critical",
        slaStartedAt: start,
        slaPolicyHours: 4,
        slaDueAt: new Date(start.getTime() + 4 * 60 * 60 * 1000),
        slaStatus: "due_soon",
      },
    });

    await automation.evaluateActionAutomation({ incidentKey });
    await automation.evaluateActionAutomation({ incidentKey });

    const dueSoon = await prisma.systemTestIncidentEvent.count({
      where: { incidentKey, type: "sla_due_soon" },
    });
    expect(dueSoon).toBe(1);
    const row = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    expect(row!.slaDueSoonNotifiedAt).toBeTruthy();
  });

  it("emits overdue once (deduped)", async () => {
    const run = await createRun(prisma, "overdue");
    const incidentKey = `overdue_${Date.now()}`;
    await seedAction(incidentKey, run.id);

    const created = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    const start = new Date(created!.createdAt.getTime() - 6 * 60 * 60 * 1000);
    await prisma.systemTestIncidentAction.update({
      where: { incidentKey },
      data: {
        priority: "critical",
        slaStartedAt: start,
        slaPolicyHours: 4,
        slaDueAt: new Date(start.getTime() + 4 * 60 * 60 * 1000),
        slaStatus: "overdue",
      },
    });

    await automation.evaluateActionAutomation({ incidentKey });
    await automation.evaluateActionAutomation({ incidentKey });

    const overdueEv = await prisma.systemTestIncidentEvent.count({
      where: { incidentKey, type: "sla_overdue" },
    });
    expect(overdueEv).toBe(1);
  });

  it("queues critical unassigned notification once until assign", async () => {
    const run = await createRun(prisma, "crit");
    const incidentKey = `crit_un_${Date.now()}`;
    await seedAction(incidentKey, run.id);

    await prisma.systemTestIncidentAction.update({
      where: { incidentKey },
      data: { priority: "critical", ownerUserId: null },
    });

    await automation.evaluateActionAutomation({ incidentKey });
    await automation.evaluateActionAutomation({ incidentKey });

    const q = await prisma.systemTestIncidentEvent.findMany({
      where: { incidentKey, type: "notification_queued" },
    });
    const critical = q.filter(
      (e) => (e.metadataJson as { reason?: string })?.reason === "new_unassigned_critical",
    );
    expect(critical.length).toBe(1);
  });

  it("sets escalationReadyAt once for overdue critical", async () => {
    const run = await createRun(prisma, "esc");
    const incidentKey = `esc_${Date.now()}`;
    await seedAction(incidentKey, run.id);

    const created = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    const start = new Date(created!.createdAt.getTime() - 6 * 60 * 60 * 1000);
    await prisma.systemTestIncidentAction.update({
      where: { incidentKey },
      data: {
        priority: "critical",
        slaStartedAt: start,
        slaPolicyHours: 4,
        slaDueAt: new Date(start.getTime() + 4 * 60 * 60 * 1000),
        slaStatus: "overdue",
      },
    });

    await automation.evaluateActionAutomation({ incidentKey });
    await automation.evaluateActionAutomation({ incidentKey });

    const esc = await prisma.systemTestIncidentEvent.count({
      where: { incidentKey, type: "escalation_ready" },
    });
    expect(esc).toBe(1);
    const row = await prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey },
    });
    expect(row!.escalationReadyAt).toBeTruthy();
  });

  it("assign-to-me updates owner", async () => {
    const run = await createRun(prisma, "atm");
    const incidentKey = `atm_${Date.now()}`;
    await seedAction(incidentKey, run.id);

    const user = await prisma.user.create({
      data: {
        email: `atm_${Date.now()}@example.com`,
        passwordHash: "x",
        role: "admin",
      },
    });

    const detail = await actions.assignToMe({
      incidentKey,
      actorUserId: user.id,
    });

    expect(detail.ownerUserId).toBe(user.id);

    await prisma.systemTestIncidentAction.update({
      where: { incidentKey },
      data: { ownerUserId: null },
    });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it("list filters by slaStatus and escalationReady and unassignedOnly", async () => {
    const run = await createRun(prisma, "list");
    const incidentKey = `list_${Date.now()}`;
    await seedAction(incidentKey, run.id);

    await prisma.systemTestIncidentAction.update({
      where: { incidentKey },
      data: {
        slaStatus: "overdue",
        escalationReadyAt: new Date(),
        ownerUserId: null,
      },
    });

    const overdueList = await actions.listActions({
      slaStatus: ["overdue"],
      limit: 50,
    });
    expect(overdueList.items.some((i) => i.incidentKey === incidentKey)).toBe(true);

    const esc = await actions.listActions({
      escalationReady: true,
      limit: 50,
    });
    expect(esc.items.some((i) => i.incidentKey === incidentKey)).toBe(true);

    const un = await actions.listActions({
      unassignedOnly: true,
      limit: 50,
    });
    expect(un.items.some((i) => i.incidentKey === incidentKey)).toBe(true);
  });

  it("overdue ordering outranks plain priority within active work", async () => {
    const run = await createRun(prisma, "sort");
    const kOverdue = `sort_od_${Date.now()}`;
    const kHigh = `sort_hi_${Date.now()}`;
    await seedAction(kOverdue, run.id);
    await seedAction(kHigh, run.id);

    await prisma.systemTestIncidentAction.update({
      where: { incidentKey: kOverdue },
      data: {
        priority: "low",
        slaStatus: "overdue",
        updatedAt: new Date(Date.now() - 60_000),
      },
    });
    await prisma.systemTestIncidentAction.update({
      where: { incidentKey: kHigh },
      data: {
        priority: "critical",
        slaStatus: "on_track",
        updatedAt: new Date(),
      },
    });

    const list = await actions.listActions({ limit: 50 });
    const iOd = list.items.findIndex((i) => i.incidentKey === kOverdue);
    const iHi = list.items.findIndex((i) => i.incidentKey === kHigh);
    expect(iOd).toBeLessThan(iHi);
  });
});
