"use client";

import Link from "next/link";

export function DevRoleSwitcher({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="flex gap-2 text-xs text-slate-500">
        <Link href="/admin" className="underline">
          A
        </Link>
        <Link href="/fo" className="underline">
          FO
        </Link>
        <Link href="/customer" className="underline">
          C
        </Link>
      </span>
    );
  }
  return null;
}
