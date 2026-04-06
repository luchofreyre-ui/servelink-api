import { DispatchExceptionActionStatus } from "@prisma/client";

/**
 * Single source of truth for exception action status transitions (mirrors
 * `DispatchExceptionActionsService.assertTransitionAllowed`).
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<
  DispatchExceptionActionStatus,
  DispatchExceptionActionStatus[]
> = {
  open: ["investigating", "waiting", "dismissed", "resolved"],
  investigating: ["open", "waiting", "resolved", "dismissed"],
  waiting: ["investigating", "resolved", "dismissed"],
  resolved: ["investigating"],
  dismissed: ["open"],
};

export function canTransitionExceptionStatus(
  from: DispatchExceptionActionStatus,
  to: DispatchExceptionActionStatus,
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
