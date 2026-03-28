import { Test } from "@nestjs/testing";

import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";
import { DispatchExceptionActionsService } from "../src/modules/dispatch/dispatch-exception-actions.service";
import { DispatchExceptionAutomationService } from "../src/modules/dispatch/dispatch-exception-automation.service";
import { DispatchExceptionLifecycleService } from "../src/modules/dispatch/dispatch-exception-lifecycle.service";
import { buildDispatchExceptionKeyFromBookingId } from "../src/modules/dispatch/dispatch-exception-key";

jest.setTimeout(60_000);

describe("DispatchExceptionLifecycleService", () => {
  let prisma: PrismaService;
  let lifecycle: DispatchExceptionLifecycleService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        DispatchExceptionAutomationService,
        DispatchExceptionActionsService,
        DispatchExceptionLifecycleService,
      ],
    }).compile();
    prisma = mod.get(PrismaService);
    lifecycle = mod.get(DispatchExceptionLifecycleService);
  });

  it("marks resolved validation passed after two absent refresh cycles", async () => {
    const bookingId = `bk_life_${Date.now()}`;
    const key = buildDispatchExceptionKeyFromBookingId(bookingId);
    await prisma.dispatchExceptionAction.create({
      data: {
        dispatchExceptionKey: key,
        status: "resolved",
        priority: "medium",
        resolvedAt: new Date(),
        validationState: "pending",
        metadataJson: {
          bookingId,
          exceptionReasons: ["no_candidates"],
          absentStreak: 0,
        },
      },
    });

    await lifecycle.syncAfterExceptionsRefreshed([], null);
    const r1 = await prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey: key },
    });
    const meta1 = r1!.metadataJson as Record<string, unknown>;
    expect(meta1.absentStreak).toBe(1);

    await lifecycle.syncAfterExceptionsRefreshed([], null);
    const r2 = await prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey: key },
    });
    expect(r2!.validationState).toBe("passed");
    expect(r2!.validationLastPassedAt).toBeTruthy();

    const ev = await prisma.dispatchExceptionActionEvent.findFirst({
      where: { dispatchExceptionKey: key, type: "validation_passed" },
    });
    expect(ev).toBeTruthy();
  });
});
