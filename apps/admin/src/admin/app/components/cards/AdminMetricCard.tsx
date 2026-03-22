type AdminMetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
};

export function AdminMetricCard({ title, value, subtitle, trend }: AdminMetricCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {subtitle ? <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p> : null}
      {trend ? (
        <p
          className={`mt-1 text-xs ${
            trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-500"
          }`}
        >
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
        </p>
      ) : null}
    </div>
  );
}
