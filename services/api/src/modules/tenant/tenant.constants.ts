export const DEFAULT_TENANT_ID = "nustandard" as const;

export const KNOWN_TENANT_IDS = [DEFAULT_TENANT_ID] as const;

export const DEFAULT_TENANT_HOSTS = [
  "nustandardcleaning.com",
  "www.nustandardcleaning.com",
] as const;

export const TENANT_HOST_MAP = {
  "nustandardcleaning.com": DEFAULT_TENANT_ID,
  "www.nustandardcleaning.com": DEFAULT_TENANT_ID,
} as const;
