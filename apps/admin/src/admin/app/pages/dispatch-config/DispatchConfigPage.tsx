import { useState, useEffect } from "react";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { setAdminDocumentTitle } from "../../lib/documentTitle";
import { AdminLoadingState } from "../../components/states/AdminLoadingState";
import { AdminErrorState } from "../../components/states/AdminErrorState";
import { DispatchConfigForm } from "../../../features/dispatch-config/components/DispatchConfigForm";
import { DispatchConfigComparisonCard } from "../../../features/dispatch-config/components/DispatchConfigComparisonCard";
import { DispatchConfigPublishModal } from "../../../features/dispatch-config/components/DispatchConfigPublishModal";
import {
  useActiveDispatchConfig,
  useDraftDispatchConfig,
  useDispatchConfigCompare,
  usePublishPreview,
  useUpdateDraftDispatchConfig,
  usePublishDraftDispatchConfig,
} from "../../../features/dispatch-config/hooks/useDispatchConfig";
import type { UpdateDraftDispatchConfigPayload } from "../../../features/dispatch-config/api/types";

export function DispatchConfigPage() {
  useEffect(() => {
    setAdminDocumentTitle("Dispatch Config");
  }, []);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const active = useActiveDispatchConfig();
  const draft = useDraftDispatchConfig();
  const compare = useDispatchConfigCompare();
  const preview = usePublishPreview();
  const updateDraft = useUpdateDraftDispatchConfig();
  const publish = usePublishDraftDispatchConfig();

  const isLoading = active.isLoading || draft.isLoading;
  const isError = active.isError || draft.isError;
  const error = active.error ?? draft.error;

  const handleSaveDraft = (payload: UpdateDraftDispatchConfigPayload) => {
    updateDraft.mutate(payload);
  };

  const handlePublishConfirm = () => {
    publish.mutate(undefined, {
      onSuccess: () => setPublishModalOpen(false),
    });
  };

  if (isLoading) {
    return <AdminLoadingState message="Loading dispatch config…" />;
  }

  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load config."}
        onRetry={() => { active.refetch(); draft.refetch(); }}
      />
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Dispatch Config"
        subtitle="Manage live dispatch engine weights and behavior. Edit draft, then publish to activate."
        actions={
          <button
            type="button"
            className="rounded-xl border border-gray-900 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
            onClick={() => setPublishModalOpen(true)}
            disabled={!preview.data?.canPublish}
          >
            Publish draft
          </button>
        }
      />

      <div className="mb-4 grid gap-4 rounded-2xl border bg-white p-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Active config</h3>
          <p className="text-lg font-semibold">
            {active.data ? `Version ${active.data.version}` : "—"}
          </p>
          {active.data?.label ? (
            <p className="text-sm text-gray-600">{active.data.label}</p>
          ) : null}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Draft config</h3>
          <p className="text-lg font-semibold">
            {draft.data ? `Version ${draft.data.version}` : "—"}
          </p>
          {draft.data?.label ? (
            <p className="text-sm text-gray-600">{draft.data.label}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold">Edit draft</h2>
          <DispatchConfigForm
            draft={draft.data}
            isSaving={updateDraft.isPending}
            onSave={handleSaveDraft}
          />
        </section>
        <section>
          <DispatchConfigComparisonCard
            compare={compare.data}
            isLoading={compare.isLoading}
          />
        </section>
      </div>

      {draft.data?.configJson != null && (
        <section className="mt-6 rounded-2xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Raw config JSON</h2>
          <pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-3 text-xs">
            {JSON.stringify(draft.data.configJson, null, 2)}
          </pre>
        </section>
      )}

      <DispatchConfigPublishModal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        preview={preview.data}
        isPublishing={publish.isPending}
        onConfirm={handlePublishConfirm}
      />
    </div>
  );
}
