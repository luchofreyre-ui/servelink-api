import { Injectable } from "@nestjs/common";
import {
  DEFAULT_TENANT_ID,
  KNOWN_TENANT_IDS,
  TENANT_HOST_MAP,
} from "./tenant.constants";
import { InvalidTenantException } from "./tenant.errors";
import type {
  TenantResolutionResult,
  TenantResolveOptions,
} from "./tenant.types";

@Injectable()
export class TenantResolver {
  normalizeTenantId(input?: string | null): string {
    const normalized = input?.trim().toLowerCase();
    return normalized ? normalized : DEFAULT_TENANT_ID;
  }

  private normalizeHost(host?: string | null): string | null {
    const normalized = host?.trim().toLowerCase();
    if (!normalized) return null;
    return normalized.split(":")[0] ?? null;
  }

  private isKnownTenantId(tenantId: string): boolean {
    return KNOWN_TENANT_IDS.includes(tenantId as (typeof KNOWN_TENANT_IDS)[number]);
  }

  resolveFromHost(host?: string | null): TenantResolutionResult {
    const normalizedHost = this.normalizeHost(host);

    if (normalizedHost) {
      const mappedTenantId =
        TENANT_HOST_MAP[normalizedHost as keyof typeof TENANT_HOST_MAP];

      if (mappedTenantId) {
        return {
          tenantId: mappedTenantId,
          source: "host",
          host: normalizedHost,
        };
      }
    }

    return {
      tenantId: DEFAULT_TENANT_ID,
      source: "default",
      host: normalizedHost,
    };
  }

  resolve(options?: TenantResolveOptions): TenantResolutionResult {
    const explicitTenantId = options?.tenantId?.trim().toLowerCase();

    if (explicitTenantId) {
      if (
        options?.validateExplicitTenant &&
        !this.isKnownTenantId(explicitTenantId)
      ) {
        throw new InvalidTenantException(explicitTenantId);
      }

      return {
        tenantId: this.normalizeTenantId(explicitTenantId),
        source: "explicit",
        host: options?.host ?? null,
      };
    }

    return this.resolveFromHost(options?.host ?? null);
  }
}
