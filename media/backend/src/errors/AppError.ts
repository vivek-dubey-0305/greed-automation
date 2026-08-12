export type ErrorCategory =
  | 'ValidationError'
  | 'AuthenticationError'
  | 'AuthorizationError'
  | 'NotFoundError'
  | 'ConflictError'
  | 'ExternalServiceError'
  | 'DatabaseError'
  | 'RateLimitError'
  | 'TimeoutError'
  | 'AutomationError'
  | 'UnknownError';

export class AppError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly cause?: any;

  constructor(params: {
    message: string;
    code: string;
    category: ErrorCategory;
    statusCode?: number;
    retryable?: boolean;
    cause?: any;
  }) {
    super(params.message);
    this.name = 'AppError';
    this.code = params.code;
    this.category = params.category;
    this.statusCode = params.statusCode ?? 500;
    this.retryable = params.retryable ?? false;
    this.cause = params.cause;
    Error.captureStackTrace(this, this.constructor);
  }
}
