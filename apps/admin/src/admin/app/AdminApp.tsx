import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminAppProviders } from "./providers/AdminAppProviders";
import { AdminProtectedRoute } from "./guards/AdminProtectedRoute";
import { AdminLayout } from "./layout/AdminLayout";
import { adminRouteRegistry } from "./routes/adminRouteRegistry";
import { ADMIN_ROUTE_ROOT } from "./routes/adminRoutes";

export function AdminApp() {
  return (
    <AdminAppProviders>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<adminRouteRegistry.dashboard />} />
            <Route path="exceptions" element={<adminRouteRegistry.exceptions />} />
            <Route path="bookings/:bookingId" element={<adminRouteRegistry.bookingDetail />} />
            <Route path="dispatch-config" element={<adminRouteRegistry.dispatchConfig />} />
            <Route path="activity" element={<adminRouteRegistry.activity />} />
            <Route path="anomalies" element={<adminRouteRegistry.anomalies />} />
            <Route path="supply" element={<adminRouteRegistry.supply />} />
            <Route
              path="supply/franchise-owners/new"
              element={<adminRouteRegistry.supplyFoNew />}
            />
            <Route
              path="supply/franchise-owners"
              element={<adminRouteRegistry.supplyFoFleet />}
            />
            <Route
              path="supply/franchise-owners/:foId"
              element={<adminRouteRegistry.supplyFoDetail />}
            />
            <Route
              path="supply/shipment-planner"
              element={<adminRouteRegistry.supplyShipments />}
            />
            <Route path="supply/rules" element={<adminRouteRegistry.supplyRules />} />
            <Route path="supply/activity" element={<adminRouteRegistry.supplyActivity />} />
            <Route path="settings" element={<adminRouteRegistry.settings />} />
            <Route path="*" element={<Navigate to={ADMIN_ROUTE_ROOT} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AdminAppProviders>
  );
}
