import { SetMetadata } from "@nestjs/common";

export const ADMIN_PERMISSIONS_KEY = "admin_permissions";

export function AdminPermissions(...permissions: string[]) {
  return SetMetadata(ADMIN_PERMISSIONS_KEY, permissions);
}
