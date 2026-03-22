export type AdminListResponse<T> = {
  items: T[];
  nextCursor: string | null;
  totalCount?: number;
};
