import type { ReactNode } from "react";
import Link from "next/link";
import { DevRoleSwitcher } from "@/components/dev/DevRoleSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SessionSignOutButton } from "@/components/auth/SessionSignOutButton";

export default function AppShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="border-b border-gray-200 bg-white p-3 md:p-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-900 md:text-base">
            <Link href="/" className="font-semibold">
              Servelink
            </Link>
            <Link href="/fo" className="hover:underline">
              FO
            </Link>
            <Link href="/customer" className="hover:underline">
              Customer
            </Link>
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
            <Link href="/notifications" className="hover:underline">
              Notifications
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-3 md:gap-4">
            <SessionSignOutButton />
            <NotificationBell />
            <DevRoleSwitcher compact />
          </div>
        </div>
      </div>

      <div className="w-full min-h-screen bg-white text-gray-900">{children}</div>
    </>
  );
}
