export type AdminNote = {
  id: string;
  body: string;
  authorName?: string | null;
  createdAt: string;
};

type AdminNotesPanelProps = {
  notes: AdminNote[];
  emptyMessage?: string;
  composer?: React.ReactNode;
};

export function AdminNotesPanel({
  notes,
  emptyMessage = "No notes.",
  composer,
}: AdminNotesPanelProps) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notes</h3>
        {composer}
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="border-l-2 border-gray-200 pl-3">
              <p className="text-sm text-gray-900">{note.body}</p>
              <p className="mt-1 text-xs text-gray-500">
                {note.authorName ?? "—"} · {note.createdAt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
