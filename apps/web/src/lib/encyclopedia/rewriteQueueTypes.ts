export type RewriteSectionKey =
  | "what_it_is"
  | "why_it_happens"
  | "where_it_appears"
  | "how_to_fix_it"
  | "what_to_avoid"
  | "what_to_expect";

export type RewriteTask = {
  id: string;
  slug: string;
  section: RewriteSectionKey;
  reason: string;
  status: "open" | "completed" | "reopened";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type RewriteQueueStore = {
  records: RewriteTask[];
};
