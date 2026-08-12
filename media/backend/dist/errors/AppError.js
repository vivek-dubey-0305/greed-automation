export class AppError extends Error {
    code;
    category;
    statusCode;
    retryable;
    cause;
    constructor(params) {
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
