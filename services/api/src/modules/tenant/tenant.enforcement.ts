import { MissingTenantContextException } from "./tenant.errors";

export function requireTenantId(
  tenantId: string | null | undefined,
  context: string,
): string {
  const normalized = tenantId?.trim();

  if (!normalized) {
    throw new MissingTenantContextException(context);
  }

  return normalized;
}

export function requireReadTenantId(
  tenantId: string | null | undefined,
  context: string,
): string {
  const normalized = tenantId?.trim();

  if (!normalized) {
    throw new MissingTenantContextException(context);
  }

  return normalized;
}
