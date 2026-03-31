import type { RewriteSectionKey } from "./rewriteQueueTypes";

export type RewriteApplicationRecord = {
  id: string;
  taskId: string;
  slug: string;
  sectionKey: RewriteSectionKey;
  appliedText: string;
  appliedAt: string;
};

export type RewriteApplicationStore = {
  records: RewriteApplicationRecord[];
};
