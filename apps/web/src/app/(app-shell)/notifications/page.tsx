import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Notifications</h1>
      <NotificationCenter />
    </div>
  );
}

