export type RepairEventType =
  | "attach_evidence"
  | "force_pass"
  | "force_fail"
  | "clear_override"
  | "note_added"
  | "rewrite_created"
  | "rewrite_completed"
  | "add_attached_evidence"
  | "remove_attached_evidence"
  | "repair_completed"
  | "repair_reopened"
  | "replace_attached_evidence"
  | "override_note_updated"
  | "editorial_note_deleted"
  | "rewrite_draft_saved"
  | "rewrite_draft_deleted"
  | "rewrite_applied"
  | "rewrite_application_recorded";

export type RepairHistoryEvent = {
  id: string;
  slug: string;
  type: RepairEventType;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type RepairHistoryStore = {
  records: RepairHistoryEvent[];
};
