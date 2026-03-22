import { NavLink } from "react-router-dom";
import { ADMIN_ROUTES } from "../../routes/adminRoutes";

const MAIN_NAV = [
  { label: "Dashboard", to: ADMIN_ROUTES.dashboard },
  { label: "Exceptions", to: ADMIN_ROUTES.exceptions },
  { label: "Dispatch Config", to: ADMIN_ROUTES.dispatchConfig },
  { label: "Activity", to: ADMIN_ROUTES.activity },
  { label: "Anomalies", to: ADMIN_ROUTES.anomalies },
  { label: "Settings", to: ADMIN_ROUTES.settings },
] as const;

const SUPPLY_NESTED = [
  { label: "Overview", to: ADMIN_ROUTES.supplyOverview },
  { label: "Shipment Planner", to: ADMIN_ROUTES.shipmentPlanner },
  { label: "Rules", to: ADMIN_ROUTES.supplyRules },
  { label: "Activity", to: ADMIN_ROUTES.supplyActivity },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-xl px-3 py-2 text-sm hover:bg-gray-100 ${isActive ? "bg-gray-100 font-medium" : ""}`;

export function AdminSidebar() {
  return (
    <aside className="w-72 border-r bg-white p-4">
      <div className="mb-2 text-lg font-semibold">Nu Standard Cleaning Admin</div>
      <div className="mb-6 text-xs text-gray-500">
        {typeof window !== "undefined" ? window.location.host : "admin"}
      </div>
      <nav className="space-y-1">
        {MAIN_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass}>
            {item.label}
          </NavLink>
        ))}
        <div className="pt-2">
          <p className="px-3 py-1 text-xs font-medium uppercase text-gray-400">
            Supply
          </p>
          {SUPPLY_NESTED.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2 pl-5 text-sm hover:bg-gray-100 ${
                  isActive ? "bg-gray-100 font-medium" : ""
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}
