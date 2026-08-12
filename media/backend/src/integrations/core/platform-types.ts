export interface PlatformCapabilities {
  supportsImagePost: boolean;
  supportsVideo: boolean;
  supportsMultipleImages: boolean;
  supportsTextOnly: boolean;
  supportsOAuth: boolean;
  supportsScheduling: boolean;
  supportsPostStatus: boolean;
  supportsDrafts: boolean;
  supportsDelete: boolean;
}

export interface PublishRequest {
  platformPostId: string;
  campaignId: string;
  socialAccountId: string;
  content: string;
  mediaUrls: string[];
  hashtags?: string[];
  accessToken: string;
}

export interface PublishResult {
  success: boolean;
  externalId?: string;
  error?: string;
  retryable?: boolean;
}

export interface OAuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  externalAccountId: string;
  displayName: string;
  username?: string;
  scopes?: string[];
}
