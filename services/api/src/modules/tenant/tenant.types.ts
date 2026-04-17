import { KNOWN_TENANT_IDS } from "./tenant.constants";

export type KnownTenantId = (typeof KNOWN_TENANT_IDS)[number];

export type TenantResolutionSource = "explicit" | "host" | "default";

export type TenantResolutionResult = {
  tenantId: string;
  source: TenantResolutionSource;
  host?: string | null;
};

export type TenantResolveOptions = {
  tenantId?: string | null;
  host?: string | null;
  validateExplicitTenant?: boolean;
};
