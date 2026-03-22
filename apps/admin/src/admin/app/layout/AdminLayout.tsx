import { Outlet } from "react-router-dom";
import { AdminSidebar } from "../components/navigation/AdminSidebar";

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
