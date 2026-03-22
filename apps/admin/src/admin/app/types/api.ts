export type ApiError = {
  status: number;
  message: string;
};

export type ApiResponse<T> =
  | { data: T; error?: never }
  | { data?: never; error: ApiError };
