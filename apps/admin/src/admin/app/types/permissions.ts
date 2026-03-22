export type AdminPermission =
  | "dispatch.read"
  | "dispatch.write"
  | "dispatch.publish"
  | "dispatch.rollback"
  | "dispatch.ops"
  | "exceptions.read"
  | "exceptions.write"
  | "anomalies.read"
  | "anomalies.write"
  | "audit.read"
  | "supply.read"
  | "supply.shipments.write"
  | "supply.rules.write"
  | "supply.overrides.write"
  | "supply.audit.read"
  | "supply.owner";

export type AdminUser = {
  id: string;
  email: string;
  role: string;
  permissions: AdminPermission[];
};
