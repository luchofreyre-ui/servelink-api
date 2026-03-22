import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { AdminLoadingState } from "../../components/states/AdminLoadingState";
import { AdminErrorState } from "../../components/states/AdminErrorState";
import { AdminEmptyState } from "../../components/states/AdminEmptyState";
import { AdminUnavailableState } from "../../components/states/AdminUnavailableState";
import { SupplyBackendBanner } from "../../../features/supply/components/SupplyBackendBanner";
import { AdminSelect } from "../../components/forms/AdminSelect";
import { formatDateTime } from "../../lib/format";
import { useSupplyActivity } from "../../../features/supply/hooks/useSupply";
import { ADMIN_ROUTES } from "../../routes/adminRoutes";
import { isRouteUnavailableError } from "../../lib/apiErrors";
import { setAdminDocumentTitle } from "../../lib/documentTitle";

const EVENT_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "restock", label: "Restock" },
  { value: "adjustment", label: "Adjustment" },
  { value: "shipment_plan", label: "Shipment plan" },
  { value: "shipment_status", label: "Shipment status" },
  { value: "rule_change", label: "Rule change" },
];

export function SupplyActivityPage() {
  useEffect(() => {
    setAdminDocumentTitle("Supply Activity");
  }, []);

  const [eventType, setEventType] = useState("");
  const params = useMemo(
    () => (eventType ? { eventType } : undefined),
    [eventType],
  );
  const { data, isLoading, isError, error, refetch } = useSupplyActivity(params);
  const unavailable = isError && isRouteUnavailableError(error);
  const otherError = isError && !unavailable;
  const items = data?.items ?? [];

  if (isLoading) {
    return <AdminLoadingState message="Loading supply activity…" />;
  }

  if (unavailable) {
    return (
      <div>
        <AdminPageHeader
          title="Supply Activity"
          subtitle="Restocks, adjustments, shipment plans, rule changes."
        />
        <SupplyBackendBanner />
        <AdminUnavailableState endpointLabel="GET /supply/activity" />
      </div>
    );
  }

  if (otherError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load supply activity."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Supply Activity"
        subtitle="Restocks, adjustments, shipment plans, rule changes."
      />
      <SupplyBackendBanner />
      <div className="mb-4">
        <AdminSelect
          label="Event type"
          value={eventType}
          onChange={setEventType}
          options={EVENT_TYPE_OPTIONS}
        />
      </div>
      <section className="rounded-2xl border bg-white p-4">
        {items.length === 0 ? (
          <AdminEmptyState
            title="No supply activity"
            description="No events in the selected range."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">FO</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Summary</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="px-3 py-2 text-gray-600">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      {item.foId ? (
                        <Link
                          to={ADMIN_ROUTES.foSupplyDetail(item.foId)}
                          className="text-blue-600 hover:underline"
                        >
                          {item.foId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium">{item.eventType}</td>
                    <td className="px-3 py-2 text-gray-600">{item.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data?.nextCursor && (
          <p className="mt-3 text-center text-sm text-gray-500">
            More available (cursor-based pagination).
          </p>
        )}
      </section>
    </div>
  );
}
