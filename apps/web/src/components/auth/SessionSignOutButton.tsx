"use client";

import { usePathname, useRouter } from "next/navigation";
import { clearSessionAccessToken } from "@/lib/auth";

/**
 * Sign out for customer / FO app-shell routes (clears localStorage + cookie).
 */
export function SessionSignOutButton() {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const onCustomer =
    pathname === "/customer" ||
    (pathname.startsWith("/customer/") && !pathname.startsWith("/customer/auth"));
  const onFo =
    pathname === "/fo" ||
    (pathname.startsWith("/fo/") && !pathname.startsWith("/fo/auth"));

  if (!onCustomer && !onFo) {
    return null;
  }

  const authHref = onFo ? "/fo/auth" : "/customer/auth";

  return (
    <button
      type="button"
      onClick={() => {
        clearSessionAccessToken();
        router.push(authHref);
        router.refresh();
      }}
      className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
    >
      Sign out
    </button>
  );
}
