import { AppError } from '../../errors/AppError';
export class PlatformIntegrationError extends AppError {
    platform;
    platformErrorCode;
    originalError;
    constructor(platform, platformErrorCode, message, retryable, originalError) {
        super({
            message,
            code: `${platform}_${platformErrorCode}`,
            category: 'ExternalServiceError',
            statusCode: 500,
            retryable,
            cause: originalError
        });
        this.platform = platform;
        this.platformErrorCode = platformErrorCode;
        this.originalError = originalError;
        this.name = 'PlatformIntegrationError';
    }
}
