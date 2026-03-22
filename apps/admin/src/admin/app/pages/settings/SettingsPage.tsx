import { AdminPageHeader } from "../../components/layout/AdminPageHeader";

export function SettingsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Settings"
        subtitle="Access and operational preferences."
      />

      <section className="rounded-2xl border bg-white p-4">
        <p className="text-sm text-gray-500">
          Thin v1 settings surface.
        </p>
      </section>
    </div>
  );
}
