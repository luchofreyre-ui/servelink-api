import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { DispatchExceptionsPage } from "../pages/exceptions/DispatchExceptionsPage";
import { BookingDispatchDetailPage } from "../pages/booking-detail/BookingDispatchDetailPage";
import { DispatchConfigPage } from "../pages/dispatch-config/DispatchConfigPage";
import { ActivityPage } from "../pages/activity/ActivityPage";
import { AnomaliesPage } from "../pages/anomalies/AnomaliesPage";
import { SupplyOverviewPage } from "../pages/supply/SupplyOverviewPage";
import { FoSupplyDetailPage } from "../pages/supply/FoSupplyDetailPage";
import { ShipmentPlannerPage } from "../pages/supply/ShipmentPlannerPage";
import { SupplyRulesPage } from "../pages/supply/SupplyRulesPage";
import { SupplyActivityPage } from "../pages/supply/SupplyActivityPage";
import { SettingsPage } from "../pages/settings/SettingsPage";

export const adminRouteRegistry = {
  dashboard: DashboardPage,
  exceptions: DispatchExceptionsPage,
  bookingDetail: BookingDispatchDetailPage,
  dispatchConfig: DispatchConfigPage,
  activity: ActivityPage,
  anomalies: AnomaliesPage,
  supply: SupplyOverviewPage,
  supplyFoDetail: FoSupplyDetailPage,
  supplyShipments: ShipmentPlannerPage,
  supplyRules: SupplyRulesPage,
  supplyActivity: SupplyActivityPage,
  settings: SettingsPage,
};
