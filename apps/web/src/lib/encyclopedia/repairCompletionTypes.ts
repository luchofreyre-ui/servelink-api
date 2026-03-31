export type RepairCompletionStatus = "open" | "completed";

export type RepairCompletionRecord = {
  slug: string;
  status: RepairCompletionStatus;
  note: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export type RepairCompletionStore = {
  records: RepairCompletionRecord[];
};
