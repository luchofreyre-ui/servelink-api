import { LifecycleOrchestratorService } from "../lifecycle-orchestrator.service";
import { InvalidTenantException } from "../../tenant/tenant.errors";
import { TenantResolver } from "../../tenant/tenant.resolver";
import { PrismaService } from "../../../prisma";

describe("LifecycleOrchestratorService (booking authority + tenant)", () => {
  let orchestrator: LifecycleOrchestratorService;

  beforeEach(() => {
    orchestrator = new LifecycleOrchestratorService(
      {} as PrismaService,
      new TenantResolver(),
    );
  });

  const baseInput = {
    source: "booking_direction_submit" as const,
    estimateInput: {},
  };

  it("explicit tenant path: tenantId nustandard + validateExplicitTenant true => tenantId nustandard", async () => {
    const r = await orchestrator.createBookingFromAuthority({
      ...baseInput,
      tenantId: "nustandard",
      validateExplicitTenant: true,
    });
    expect(r.tenantId).toBe("nustandard");
    expect(r.authorityOwner).toBe("orchestrator");
  });

  it("host-derived path: no explicit tenant, host www.nustandardcleaning.com => tenantId nustandard", async () => {
    const r = await orchestrator.createBookingFromAuthority({
      ...baseInput,
      host: "www.nustandardcleaning.com",
    });
    expect(r.tenantId).toBe("nustandard");
  });

  it("default path: no explicit tenant and no host => tenantId nustandard", async () => {
    const r = await orchestrator.createBookingFromAuthority({
      ...baseInput,
    });
    expect(r.tenantId).toBe("nustandard");
  });

  it("invalid explicit tenant path: badtenant + validateExplicitTenant true => InvalidTenantException", async () => {
    await expect(
      orchestrator.createBookingFromAuthority({
        ...baseInput,
        tenantId: "badtenant",
        validateExplicitTenant: true,
      }),
    ).rejects.toThrow(InvalidTenantException);
  });

  it("explicit unknown tenant with validation false remains allowed (transition compat)", async () => {
    const r = await orchestrator.createBookingFromAuthority({
      ...baseInput,
      tenantId: "legacy-unknown",
      validateExplicitTenant: false,
    });
    expect(r.tenantId).toBe("legacy-unknown");
  });

  describe("evaluateDispatchReadiness", () => {
    it("scopes by tenant when expectedTenantId is provided", async () => {
      const findFirst = jest.fn().mockResolvedValue({
        id: "b1",
        status: "pending_dispatch",
      });
      const orchestratorScoped = new LifecycleOrchestratorService(
        { booking: { findFirst } } as unknown as PrismaService,
        new TenantResolver(),
      );
      const r = await orchestratorScoped.evaluateDispatchReadiness(
        "b1",
        "nustandard",
      );
      expect(r.bookingId).toBe("b1");
      expect(r.dispatchEligible).toBe(true);
      expect(findFirst).toHaveBeenCalledWith({
        where: { id: "b1", tenantId: "nustandard" },
        select: { id: true, status: true },
      });
    });

    it("returns booking_not_found when tenant does not match scoped read", async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const orchestratorScoped = new LifecycleOrchestratorService(
        { booking: { findFirst } } as unknown as PrismaService,
        new TenantResolver(),
      );
      const r = await orchestratorScoped.evaluateDispatchReadiness(
        "b1",
        "other-tenant",
      );
      expect(r.reason).toBe("booking_not_found");
    });

    it("treats blank expectedTenantId as absent (findUnique, unscoped where)", async () => {
      const findUnique = jest.fn().mockResolvedValue({
        id: "b1",
        status: "pending_payment",
      });
      const findFirst = jest.fn();
      const orchestratorScoped = new LifecycleOrchestratorService(
        { booking: { findUnique, findFirst } } as unknown as PrismaService,
        new TenantResolver(),
      );
      await orchestratorScoped.evaluateDispatchReadiness("b1", "   ");
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: "b1" },
        select: { id: true, status: true },
      });
      expect(findFirst).not.toHaveBeenCalled();
    });
  });
});
