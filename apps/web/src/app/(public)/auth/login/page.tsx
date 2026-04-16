"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Stable entry for marketing flows that expect `/auth/login?redirect=…`.
 * Customer auth lives at `/customer/auth`.
 */
export default function AuthLoginRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get("redirect")?.trim() || "/book";
    router.replace(
      `/customer/auth?redirect=${encodeURIComponent(redirect)}`,
    );
  }, [router, searchParams]);

  return (
    <div className="min-h-[30vh] bg-[#FFF9F3] p-8 font-[var(--font-manrope)] text-sm text-[#64748B]">
      Redirecting to sign in…
    </div>
  );
}
