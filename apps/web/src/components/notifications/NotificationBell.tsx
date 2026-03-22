import Link from "next/link";

export function NotificationBell() {
  return (
    <Link href="/notifications" className="text-sm text-slate-600 underline">
      Inbox
    </Link>
  );
}
