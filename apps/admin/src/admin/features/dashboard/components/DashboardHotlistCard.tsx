import { Link } from "react-router-dom";

export type DashboardHotlistItem = {
  id: string;
  label: string;
  sublabel?: string;
  href?: string;
};

type DashboardHotlistCardProps = {
  title: string;
  viewAllHref: string;
  items: DashboardHotlistItem[];
  emptyMessage?: string;
};

export function DashboardHotlistCard({
  title,
  viewAllHref,
  items,
  emptyMessage = "None",
}: DashboardHotlistCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link to={viewAllHref} className="text-sm text-blue-600 hover:underline">
          View all
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((item) => (
            <li key={item.id}>
              {item.href ? (
                <Link to={item.href} className="text-sm text-gray-900 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className="text-sm text-gray-900">{item.label}</span>
              )}
              {item.sublabel ? (
                <span className="ml-2 text-xs text-gray-500">{item.sublabel}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
