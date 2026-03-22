export type PaginationParams = {
  page?: number;
  pageSize?: number;
  cursor?: string | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  nextCursor?: string | null;
};
