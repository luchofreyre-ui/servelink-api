import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { setAdminDocumentTitle } from "../../lib/documentTitle";
import { AdminLoadingState } from "../../components/states/AdminLoadingState";
import { AdminErrorState } from "../../components/states/AdminErrorState";
import { AdminModal } from "../../components/overlays/AdminModal";
import { AdminTextInput } from "../../components/forms/AdminTextInput";
import { formatDateTime } from "../../lib/format";
import {
  useBookingDispatchDetail,
  useBookingTimeline,
  useBookingDispatchExplainer,
  useAddBookingNote,
  useForceRedispatch,
  useAssignFo,
  useExcludeProvider,
} from "../../../features/bookings/hooks/useBookingDispatchDetail";

const BACKEND_ACTION_UNAVAILABLE = "Backend action not yet available";

export function BookingDispatchDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  useEffect(() => {
    setAdminDocumentTitle(bookingId ? `Booking ${bookingId}` : "Booking Dispatch Detail");
  }, [bookingId]);
  const [noteText, setNoteText] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [excludeModalOpen, setExcludeModalOpen] = useState(false);
  const [assignFoId, setAssignFoId] = useState("");
  const [excludeFoId, setExcludeFoId] = useState("");

  const detail = useBookingDispatchDetail(bookingId);
  const timeline = useBookingTimeline(bookingId);
  const explainer = useBookingDispatchExplainer(bookingId);
  const addNote = useAddBookingNote(bookingId);
  const redispatch = useForceRedispatch(bookingId);
  const assignFoMutation = useAssignFo(bookingId);
  const excludeMutation = useExcludeProvider(bookingId);

  const isLoading = detail.isLoading || timeline.isLoading || explainer.isLoading;
  const isError = detail.isError || timeline.isError || explainer.isError;
  const error = detail.error ?? timeline.error ?? explainer.error;

  const handleAddNote = () => {
    if (!bookingId || !noteText.trim()) return;
    addNote.mutate({ note: noteText.trim() }, { onSuccess: () => setNoteText("") });
  };

  const handleAssign = () => {
    if (!bookingId || !assignFoId.trim()) return;
    assignFoMutation.mutate(
      { franchiseOwnerId: assignFoId.trim() },
      { onSuccess: () => { setAssignModalOpen(false); setAssignFoId(""); } },
    );
  };

  const handleExclude = () => {
    if (!bookingId || !excludeFoId.trim()) return;
    excludeMutation.mutate(
      { franchiseOwnerId: excludeFoId.trim() },
      { onSuccess: () => { setExcludeModalOpen(false); setExcludeFoId(""); } },
    );
  };

  if (!bookingId) {
    return (
      <AdminErrorState message="Missing booking ID." />
    );
  }

  if (isLoading) {
    return <AdminLoadingState message="Loading booking…" />;
  }

  if (isError) {
    return (
      <AdminErrorState
        message={error instanceof Error ? error.message : "Failed to load booking."}
        onRetry={() => { detail.refetch(); timeline.refetch(); explainer.refetch(); }}
      />
    );
  }

  const booking = detail.data;
  const timelineData = timeline.data;
  const explainerData = explainer.data;

  return (
    <div>
      <AdminPageHeader
        title="Booking Dispatch Detail"
        subtitle={`${bookingId} · ${booking?.status ?? "—"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm"
              onClick={() => redispatch.mutate({})}
              disabled={redispatch.isPending}
            >
              Force redispatch
            </button>
            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm"
              onClick={() => setAssignModalOpen(true)}
            >
              Assign FO
            </button>
            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm"
              onClick={() => setExcludeModalOpen(true)}
            >
              Exclude provider
            </button>
            <button
              type="button"
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
              disabled
              title={BACKEND_ACTION_UNAVAILABLE}
            >
              Cancel active offer
            </button>
            <button
              type="button"
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
              disabled
              title={BACKEND_ACTION_UNAVAILABLE}
            >
              Resolve exception
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Booking Summary</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-500">Status</dt><dd>{booking?.status ?? "—"}</dd></div>
              <div><dt className="text-gray-500">Scheduled Start</dt><dd>{formatDateTime(booking?.scheduledStart as string)}</dd></div>
              <div><dt className="text-gray-500">Assigned FO</dt><dd>{booking?.foId ?? "—"}</dd></div>
            </dl>
          </section>

          <section className="rounded-2xl border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Dispatch Explainer</h2>
            {explainerData ? (
              <>
                <p className="text-sm text-gray-700">{explainerData.summary}</p>
                {explainerData.candidates?.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {explainerData.candidates.slice(0, 5).map((c, i) => (
                      <li key={i} className="rounded-lg border p-2 text-sm">
                        <span className="font-medium">{c.foId ?? "—"}</span>
                        {c.selected ? <span className="ml-2 text-green-600">Selected</span> : null}
                        {c.explanation?.length ? (
                          <ul className="mt-1 list-inside list-disc text-gray-600">
                            {c.explanation.slice(0, 3).map((e, j) => <li key={j}>{e}</li>)}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-gray-500">No explainer data.</p>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Admin Notes</h2>
            <div className="mb-3 flex gap-2">
              <AdminTextInput
                value={noteText}
                onChange={setNoteText}
                placeholder="Add a note…"
                className="flex-1"
              />
              <button
                type="button"
                className="rounded-xl border bg-gray-100 px-3 py-2 text-sm"
                onClick={handleAddNote}
                disabled={addNote.isPending || !noteText.trim()}
              >
                Save
              </button>
            </div>
            <ul className="space-y-2">
              {explainerData?.notes?.map((n, i) => (
                <li key={i} className="border-l-2 border-gray-200 pl-2 text-sm">{n}</li>
              ))}
              {(!explainerData?.notes?.length && !noteText) ? (
                <li className="text-sm text-gray-500">No notes yet.</li>
              ) : null}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Dispatch Timeline</h2>
            {timelineData?.decisions?.length ? (
              <ul className="space-y-2">
                {(timelineData.decisions as Array<{
                  id?: string;
                  decisionStatus?: string;
                  trigger?: string;
                  triggerDetail?: string | null;
                  createdAt?: string;
                  dispatchSequence?: number;
                }>).slice(0, 15).map((d, i) => (
                  <li key={d.id ?? i} className="rounded-lg border p-2 text-sm">
                    <span className="text-gray-500">{formatDateTime(d.createdAt)}</span>
                    <span className="mx-2">·</span>
                    <span className="font-medium">{d.decisionStatus ?? d.trigger ?? "—"}</span>
                    {d.triggerDetail ? (
                      <p className="mt-1 text-gray-600">{d.triggerDetail}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No dispatch history.</p>
            )}
          </section>
        </div>
      </div>

      <AdminModal
        open={assignModalOpen}
        title="Manual Assign"
        onClose={() => setAssignModalOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-xl border px-3 py-2" onClick={() => setAssignModalOpen(false)}>Cancel</button>
            <button type="button" className="rounded-xl bg-gray-900 px-3 py-2 text-white" onClick={handleAssign} disabled={!assignFoId.trim() || assignFoMutation.isPending}>Assign</button>
          </>
        }
      >
        <AdminTextInput label="Franchise Owner ID" value={assignFoId} onChange={setAssignFoId} placeholder="FO id" />
      </AdminModal>

      <AdminModal
        open={excludeModalOpen}
        title="Exclude Provider"
        onClose={() => setExcludeModalOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-xl border px-3 py-2" onClick={() => setExcludeModalOpen(false)}>Cancel</button>
            <button type="button" className="rounded-xl bg-red-600 px-3 py-2 text-white" onClick={handleExclude} disabled={!excludeFoId.trim() || excludeMutation.isPending}>Exclude</button>
          </>
        }
      >
        <AdminTextInput label="Franchise Owner ID" value={excludeFoId} onChange={setExcludeFoId} placeholder="FO id to exclude" />
      </AdminModal>
    </div>
  );
}
