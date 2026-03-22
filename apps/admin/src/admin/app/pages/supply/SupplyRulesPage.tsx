import { useState, useEffect } from "react";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { AdminLoadingState } from "../../components/states/AdminLoadingState";
import { AdminErrorState } from "../../components/states/AdminErrorState";
import { AdminEmptyState } from "../../components/states/AdminEmptyState";
import { AdminUnavailableState } from "../../components/states/AdminUnavailableState";
import { SupplyBackendBanner } from "../../../features/supply/components/SupplyBackendBanner";
import { AdminTextInput } from "../../components/forms/AdminTextInput";
import { useSupplyRules, useUpdateSupplyRule } from "../../../features/supply/hooks/useSupply";
import type { SupplyRule } from "../../../features/supply/api/types";
import { isRouteUnavailableError } from "../../lib/apiErrors";
import { setAdminDocumentTitle } from "../../lib/documentTitle";

export function SupplyRulesPage() {
  useEffect(() => {
    setAdminDocumentTitle("Supply Rules");
  }, []);

  const { data, isLoading, isError, error, refetch } = useSupplyRules();
  const updateRule = useUpdateSupplyRule();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const unavailable = isError && isRouteUnavailableError(error);
  const otherError = isError && !unavailable;
  const rules = data?.rules ?? [];

  if (isLoading) {
    return <AdminLoadingState message="Loading supply rules…" />;
  }

  if (unavailable) {
    return (
      <div>
        <AdminPageHeader
          title="Supply Rules"
          subtitle="Reorder thresholds, stockout risk, shipment batching."
        />
        <SupplyBackendBanner />
        <AdminUnavailableState endpointLabel="GET /supply/rules" />
      </div>
    );
  }

  if (otherError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load rules."}
        onRetry={() => refetch()}
      />
    );
  }

  const handleSave = (rule: SupplyRule) => {
    const value =
      typeof rule.value === "boolean"
        ? editValue === "true"
        : typeof rule.value === "number"
          ? parseFloat(editValue)
          : editValue;
    updateRule.mutate(
      { ruleId: rule.id, payload: { value } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditValue("");
        },
      },
    );
  };

  const startEdit = (rule: SupplyRule) => {
    setEditingId(rule.id);
    setEditValue(String(rule.value));
  };

  if (rules.length === 0) {
    return (
      <div>
        <AdminPageHeader
          title="Supply Rules"
          subtitle="Reorder thresholds, stockout risk, shipment batching."
        />
        <SupplyBackendBanner />
        <section className="rounded-2xl border bg-white p-4">
          <AdminEmptyState
            title="No rules"
            description="No supply rules configured."
          />
        </section>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Supply Rules"
        subtitle="Reorder thresholds, stockout risk, shipment batching, emergency rules."
      />
      <SupplyBackendBanner />
      <section className="rounded-2xl border bg-white p-4">
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
            >
              <div>
                <p className="font-medium">{rule.label}</p>
                {rule.description ? (
                  <p className="text-sm text-gray-500">{rule.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-gray-400">Key: {rule.key}</p>
              </div>
              <div className="flex items-center gap-2">
                {editingId === rule.id ? (
                  <>
                    <AdminTextInput
                      value={editValue}
                      onChange={setEditValue}
                      className="w-32"
                    />
                    <button
                      type="button"
                      className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white"
                      onClick={() => handleSave(rule)}
                      disabled={updateRule.isPending}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border px-3 py-1.5 text-sm"
                      onClick={() => {
                        setEditingId(null);
                        setEditValue("");
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-mono">{String(rule.value)}</span>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => startEdit(rule)}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
