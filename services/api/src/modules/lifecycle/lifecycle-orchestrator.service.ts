import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { TenantResolver } from "../tenant/tenant.resolver";
import type {
  LifecycleBookingAuthorityInput,
  LifecycleBookingAuthorityResult,
  LifecycleDispatchReadiness,
} from "./lifecycle-orchestrator.types";

@Injectable()
export class LifecycleOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantResolver: TenantResolver,
  ) {}
  /**
   * Control-plane preflight for unified booking authority. Wrapper mode: defers creation to callers.
   */
  /**
   * Canonical tenant resolution for booking writes when the caller is not already
   * carrying an orchestrator authority result (e.g. authenticated manual create).
   */
  resolveTenantForBookingWrite(options: {
    tenantId?: string | null;
    host?: string | null;
    validateExplicitTenant?: boolean;
  }): string {
    return this.tenantResolver.resolve({
      tenantId: options.tenantId,
      host: options.host ?? null,
      validateExplicitTenant: options.validateExplicitTenant ?? false,
    }).tenantId;
  }

  async createBookingFromAuthority(
    input: LifecycleBookingAuthorityInput,
  ): Promise<LifecycleBookingAuthorityResult> {
    // Tenant enforcement seam: orchestrator resolves the canonical tenant before downstream writes.
    const tenantResolution = this.tenantResolver.resolve({
      tenantId: input.tenantId,
      host: input.host ?? null,
      validateExplicitTenant: input.validateExplicitTenant ?? false,
    });
    const tenantId = tenantResolution.tenantId;
    return {
      ok: true,
      bookingId: input.bookingId ?? null,
      source: input.source,
      created: false,
      dispatchEligible: false,
      paymentRequired: false,
      message: "lifecycle orchestrator foundation — wrapper preflight ok",
      authorityOwner: "orchestrator",
      mode: "wrapper_only",
      tenantId,
    };
  }

  /**
   * Control-plane dispatch readiness from persisted booking status.
   */
  async evaluateDispatchReadiness(
    bookingId: string,
    expectedTenantId?: string | null,
  ): Promise<LifecycleDispatchReadiness> {
    const tenantFilter =
      expectedTenantId != null && String(expectedTenantId).trim() !== ""
        ? { tenantId: String(expectedTenantId).trim() }
        : {};

    const booking =
      Object.keys(tenantFilter).length > 0
        ? await this.prisma.booking.findFirst({
            where: { id: bookingId, ...tenantFilter },
            select: {
              id: true,
              status: true,
            },
          })
        : await this.prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
              id: true,
              status: true,
            },
          });

    if (!booking) {
      return {
        bookingId,
        paymentRequired: true,
        paymentSatisfied: false,
        dispatchEligible: false,
        reason: "booking_not_found",
      };
    }

    const paymentRequired = true;
    const paymentSatisfied = booking.status === "pending_dispatch" || booking.status === "assigned";
    const dispatchEligible = booking.status === "pending_dispatch";

    return {
      bookingId: booking.id,
      paymentRequired,
      paymentSatisfied,
      dispatchEligible,
      reason: dispatchEligible ? null : `booking_status_${booking.status}`,
    };
  }
}
