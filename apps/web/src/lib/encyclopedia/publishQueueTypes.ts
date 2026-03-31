// publishQueueTypes.ts

export type PublishQueueStatus = "queued" | "published" | "failed";

export type PublishQueueRecord = {
  slug: string;
  title: string;
  status: PublishQueueStatus;
  queuedAt: string;
  publishedAt?: string;
  failedAt?: string;
  error?: string;
};

export type PublishQueueFile = {
  records: PublishQueueRecord[];
};
