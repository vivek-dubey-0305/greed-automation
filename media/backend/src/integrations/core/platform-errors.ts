import { AppError } from '../../errors/AppError';

export class PlatformIntegrationError extends AppError {
  constructor(
    public platform: string,
    public platformErrorCode: string,
    message: string,
    retryable: boolean,
    public originalError?: any
  ) {
    super({
      message,
      code: `${platform}_${platformErrorCode}`,
      category: 'ExternalServiceError',
      statusCode: 500,
      retryable,
      cause: originalError
    });
    this.name = 'PlatformIntegrationError';
  }
}
