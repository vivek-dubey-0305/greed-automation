import { PlatformCapabilities, PublishRequest, PublishResult, OAuthResult } from './platform-types';

export interface PlatformAdapter {
  platform: string;
  capabilities: PlatformCapabilities;

  // OAuth
  getAuthorizationUrl(state: string, redirectUri: string): string;
  handleOAuthCallback(code: string, redirectUri: string): Promise<OAuthResult>;
  refreshAccessToken?(refreshToken: string): Promise<OAuthResult>;
  
  // Publishing
  validateMedia(mediaUrls: string[]): boolean;
  validateContent(content: string, hashtags?: string[]): boolean;
  publish(request: PublishRequest): Promise<PublishResult>;
}
