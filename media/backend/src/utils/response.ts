export function formatSuccessResponse<T>(data: T, requestId: string) {
  return {
    success: true,
    data,
    requestId,
  };
}

export function formatErrorResponse(error: {
  code: string;
  message: string;
  category: string;
  retryable: boolean;
}, requestId: string) {
  return {
    success: false,
    error,
    requestId,
  };
}
