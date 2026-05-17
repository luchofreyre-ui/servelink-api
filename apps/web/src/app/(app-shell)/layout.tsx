"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthRoleGate } from "@/components/auth/AuthRoleGate";
import { DevRoleSwitcher } from "@/components/dev/DevRoleSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SessionSignOutButton } from "@/components/auth/SessionSignOutButton";
import { ShellSearchBar } from "@/components/search/ShellSearchBar";

function gatedContent(pathname: string, children: ReactNode) {
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/auth")) {
    return <AuthRoleGate role="admin">{children}</AuthRoleGate>;
  }
  if (pathname.startsWith("/fo") && !pathname.startsWith("/fo/auth")) {
    return <AuthRoleGate role="fo">{children}</AuthRoleGate>;
  }
  if (pathname.startsWith("/customer") && !pathname.startsWith("/customer/auth")) {
    return <AuthRoleGate role="customer">{children}</AuthRoleGate>;
  }
  return <>{children}</>;
}

function shellNavMode(pathname: string): "customer" | "fo" | "admin" | "general" {
  const p = pathname || "";
  if (p.startsWith("/customer/auth")) return "general";
  if (p.startsWith("/customer")) return "customer";
  if (p.startsWith("/fo/auth")) return "general";
  if (p.startsWith("/fo")) return "fo";
  if (p.startsWith("/admin/auth")) return "general";
  if (p.startsWith("/admin")) return "admin";
  return "general";
}

function BrandMark() {
  return (
    <Link
      href="/"
      className="flex shrink-0 flex-col leading-tight sm:flex-row sm:items-baseline sm:gap-2"
    >
      <span className="font-semibold tracking-tight text-gray-900">Nu Standard</span>
      <span className="text-[11px] font-normal text-slate-500 sm:text-xs">Cleaning concierge</span>
    </Link>
  );
}

function navLinkClass(activeOverflow?: boolean, extraClass = "") {
  return [
    "rounded-lg px-2.5 py-2 text-sm text-gray-900 transition-colors min-h-[44px] inline-flex items-center",
    activeOverflow ? "whitespace-nowrap" : "",
    "hover:bg-slate-50 hover:underline",
    extraClass,
  ].join(" ");
}

function CustomerShellNav() {
  return (
    <>
      <Link href="/book" className={navLinkClass()}>
        Book a visit
      </Link>
      <Link href="/customer" className={navLinkClass()}>
        My visits
      </Link>
      <Link href="/encyclopedia" className={navLinkClass()}>
        Guides
      </Link>
      <Link href="/notifications" className={navLinkClass()}>
        Updates
      </Link>
    </>
  );
}

function FOShellNav() {
  return (
    <>
      <Link href="/fo" className={navLinkClass()}>
        Visit queue
      </Link>
      <Link href="/fo/knowledge" className={navLinkClass()}>
        Knowledge
      </Link>
      <Link href="/notifications" className={navLinkClass()}>
        Updates
      </Link>
    </>
  );
}

function AdminShellNav() {
  return (
    <>
      <Link href="/admin" className={navLinkClass(true)}>
        Admin
      </Link>
      <Link href="/admin/ops" className={navLinkClass(true, "hidden sm:inline-flex")}>
        Ops
      </Link>
      <Link href="/admin/anomalies" className={navLinkClass(true, "hidden sm:inline-flex")}>
        Anomalies
      </Link>
      <Link href="/admin/activity" className={navLinkClass(true, "hidden sm:inline-flex")}>
        Activity
      </Link>
      <Link href="/admin/exceptions" className={navLinkClass(true, "hidden md:inline-flex")}>
        Exceptions
      </Link>
      <Link href="/admin/system-tests" className={navLinkClass(true, "hidden md:inline-flex")}>
        System tests
      </Link>
      <Link href="/notifications" className={navLinkClass(true, "hidden sm:inline-flex")}>
        Notifications
      </Link>
      <Link href="/customer" className={navLinkClass(true, "hidden lg:inline-flex")}>
        Customer view
      </Link>
      <Link href="/fo" className={navLinkClass(true, "hidden lg:inline-flex")}>
        Partner view
      </Link>
    </>
  );
}

function GeneralShellNav() {
  return (
    <>
      <Link href="/book" className={navLinkClass(true)}>
        Book
      </Link>
      <Link href="/customer" className={navLinkClass(true)}>
        Customer
      </Link>
      <Link href="/fo" className={navLinkClass(true)}>
        Partner
      </Link>
      <Link href="/admin" className={navLinkClass(true)}>
        Admin
      </Link>
      <Link href="/admin/ops" className={navLinkClass(true, "hidden sm:inline-flex")}>
        Ops
      </Link>
      <Link href="/admin/anomalies" className={navLinkClass(true, "hidden sm:inline-flex")}>
        Anomalies
      </Link>
      <Link href="/admin/activity" className={navLinkClass(true, "hidden md:inline-flex")}>
        Activity
      </Link>
      <Link href="/admin/exceptions" className={navLinkClass(true, "hidden md:inline-flex")}>
        Exceptions
      </Link>
      <Link href="/admin/system-tests" className={navLinkClass(true, "hidden lg:inline-flex")}>
        System tests
      </Link>
      <Link href="/notifications" className={navLinkClass(true, "hidden sm:inline-flex")}>
        Notifications
      </Link>
    </>
  );
}

export default function AppShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const mode = shellNavMode(pathname);
  const showDevSwitcher = process.env.NODE_ENV === "development";
  const authShell = pathname.includes("/auth");

  return (
    <>
      <div className="border-b border-gray-200 bg-white px-3 py-3 md:p-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2.5 md:gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <BrandMark />
            </div>

            <ShellSearchBar
              className={`min-w-0 w-full lg:max-w-md xl:max-w-lg lg:flex-1 ${
                authShell ? "hidden sm:block" : ""
              }`}
              placeholder={authShell ? "Search guides" : undefined}
            />

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 sm:justify-end md:gap-4">
              <SessionSignOutButton />
              <NotificationBell />
              {showDevSwitcher ? <DevRoleSwitcher compact /> : null}
            </div>
          </div>

          <nav
            aria-label="Application"
            className="-mx-1 flex gap-1 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0"
          >
            {mode === "customer" ? (
              <CustomerShellNav />
            ) : mode === "fo" ? (
              <FOShellNav />
            ) : mode === "admin" ? (
              <AdminShellNav />
            ) : (
              <GeneralShellNav />
            )}
          </nav>
        </div>
      </div>

      <div className="min-h-screen w-full bg-white text-gray-900">
        {gatedContent(pathname, children)}
      </div>
    </>
  );
}
