import type { UserRole } from "@/lib/auth/authClient";
import { AuthRoleGate } from "./AuthRoleGate";

export function withRoleProtection(
  role: UserRole,
  content: React.ReactNode,
) {
  return <AuthRoleGate role={role}>{content}</AuthRoleGate>;
}
