import type { RewriteSectionKey } from "./rewriteQueueTypes";

export type RewriteDraftRecord = {
  id: string;
  taskId: string;
  slug: string;
  sectionKey: RewriteSectionKey;
  draftText: string;
  createdAt: string;
  updatedAt: string;
};

export type RewriteDraftStore = {
  records: RewriteDraftRecord[];
};
