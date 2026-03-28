import { Test } from "@nestjs/testing";

import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";
import { DispatchExceptionActionsService } from "../src/modules/dispatch/dispatch-exception-actions.service";
import { DispatchExceptionAutomationService } from "../src/modules/dispatch/dispatch-exception-automation.service";

jest.setTimeout(60_000);

describe("DispatchExceptionAutomationService", () => {
  let prisma: PrismaService;
  let automation: DispatchExceptionAutomationService;
  let actions: DispatchExceptionActionsService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        DispatchExceptionAutomationService,
        DispatchExceptionActionsService,
      ],
    }).compile();
    prisma = mod.get(PrismaService);
    automation = mod.get(DispatchExceptionAutomationService);
    actions = mod.get(DispatchExceptionActionsService);
  });

  async function seedAction(key: string) {
    await prisma.dispatchExceptionAction.create({
      data: {
        dispatchExceptionKey: key,
        status: "open",
        priority: "medium",
      },
    });
  }

  it("initializes SLA from priority (critical → 2h policy)", async () => {
    const key = `dex_v1_automation_${Date.now()}`;
    await seedAction(key);
    await prisma.dispatchExceptionAction.update({
      where: { dispatchExceptionKey: key },
      data: { priority: "critical" },
    });

    await automation.syncActionSlaState({ dispatchExceptionKey: key });

    const row = await prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey: key },
    });
    expect(row!.slaPolicyHours).toBe(2);
    expect(row!.slaStartedAt).toBeTruthy();
    expect(row!.slaDueAt).toBeTruthy();
    expect(["on_track", "due_soon", "overdue"]).toContain(row!.slaStatus);

    const started = await prisma.dispatchExceptionActionEvent.findFirst({
      where: { dispatchExceptionKey: key, type: "sla_started" },
    });
    expect(started).toBeTruthy();
  });

  it("clears SLA for resolved", async () => {
    const key = `dex_v1_res_${Date.now()}`;
    await seedAction(key);
    await automation.syncActionSlaState({ dispatchExceptionKey: key });
    await prisma.dispatchExceptionAction.update({
      where: { dispatchExceptionKey: key },
      data: { status: "resolved", resolvedAt: new Date() },
    });
    await automation.syncActionSlaState({ dispatchExceptionKey: key });

    const row = await prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey: key },
    });
    expect(row!.slaStatus).toBe("completed");
    expect(row!.slaPolicyHours).toBeNull();
  });

  it("due-soon emits once (deduped)", async () => {
    const key = `dex_v1_ds_${Date.now()}`;
    await seedAction(key);
    const created = await prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey: key },
    });
    const start = new Date(created!.createdAt.getTime() - 1.75 * 60 * 60 * 1000);
    await prisma.dispatchExceptionAction.update({
      where: { dispatchExceptionKey: key },
      data: {
        priority: "critical",
        slaStartedAt: start,
        slaPolicyHours: 2,
        slaDueAt: new Date(start.getTime() + 2 * 60 * 60 * 1000),
        slaStatus: "due_soon",
      },
    });

    await automation.evaluateActionAutomation({ dispatchExceptionKey: key });
    await automation.evaluateActionAutomation({ dispatchExceptionKey: key });

    const dueSoon = await prisma.dispatchExceptionActionEvent.count({
      where: { dispatchExceptionKey: key, type: "sla_due_soon" },
    });
    expect(dueSoon).toBe(1);
  });

  it("assign-to-me updates owner", async () => {
    const key = `dex_v1_assign_${Date.now()}`;
    await seedAction(key);
    const user = await prisma.user.create({
      data: {
        email: `dex-assign-${Date.now()}@example.com`,
        passwordHash: "x",
        role: "admin",
      },
    });
    const detail = await actions.assignToMe({
      dispatchExceptionKey: key,
      actorUserId: user.id,
    });
    expect(detail.ownerUserId).toBe(user.id);
  });

  it("list filters by slaStatus", async () => {
    const key = `dex_v1_sla_${Date.now()}`;
    await seedAction(key);
    await prisma.dispatchExceptionAction.update({
      where: { dispatchExceptionKey: key },
      data: { slaStatus: "overdue" },
    });
    const res = await actions.listActions({
      slaStatus: ["overdue"],
      search: key,
      limit: 50,
    });
    expect(res.items.some((i) => i.dispatchExceptionKey === key)).toBe(true);
  });
});
