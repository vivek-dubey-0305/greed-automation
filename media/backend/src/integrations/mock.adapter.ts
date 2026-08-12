import { PlatformAdapter } from './core/platform-adapter';
import { PlatformCapabilities, PublishRequest, PublishResult, OAuthResult } from './core/platform-types';
import { PlatformRegistry } from './core/platform-registry';

export class MockPlatformAdapter implements PlatformAdapter {
  platform: string;
  capabilities: PlatformCapabilities;

  constructor(platform: string) {
    this.platform = platform;
    this.capabilities = {
      supportsImagePost: true,
      supportsVideo: true,
      supportsMultipleImages: true,
      supportsTextOnly: true,
      supportsOAuth: true,
      supportsScheduling: false,
      supportsPostStatus: true,
      supportsDrafts: false,
      supportsDelete: false,
    };
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    return `http://localhost:3000/api/oauth/${this.platform}/callback?code=mock_code_${this.platform}&state=${state}`;
  }

  async handleOAuthCallback(code: string, redirectUri: string): Promise<OAuthResult> {
    return {
      accessToken: `mock_access_token_${this.platform}_${Date.now()}`,
      refreshToken: `mock_refresh_token_${this.platform}_${Date.now()}`,
      expiresIn: 3600, // 1 hour
      externalAccountId: `ext_${this.platform}_user123`,
      displayName: `Mock ${this.platform} User`,
      username: `@mockuser_${this.platform}`,
      scopes: ['read', 'write'],
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthResult> {
    return {
      accessToken: `mock_access_token_${this.platform}_${Date.now()}_refreshed`,
      refreshToken: `mock_refresh_token_${this.platform}_${Date.now()}_refreshed`,
      expiresIn: 3600,
      externalAccountId: `ext_${this.platform}_user123`,
      displayName: `Mock ${this.platform} User`,
    };
  }

  validateMedia(mediaUrls: string[]): boolean {
    return true; // Accept all
  }

  validateContent(content: string, hashtags?: string[]): boolean {
    return true; // Accept all
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1000));

    // For testing failure, we can check if content contains "force_fail"
    if (request.content.includes('force_fail')) {
      return {
        success: false,
        error: 'Simulated API failure due to force_fail flag',
        retryable: true,
      };
    }

    if (request.content.includes('force_auth_error')) {
      return {
        success: false,
        error: 'Simulated API failure: invalid token',
        retryable: false, // Must reauth
      };
    }

    return {
      success: true,
      externalId: `mock_post_id_${Date.now()}`,
    };
  }
}

// Register mocks for local testing (can be disabled when real ones are built)
export function registerMockAdapters() {
  PlatformRegistry.register('instagram', new MockPlatformAdapter('instagram'));
  PlatformRegistry.register('linkedin', new MockPlatformAdapter('linkedin'));
  PlatformRegistry.register('x', new MockPlatformAdapter('x'));
}
