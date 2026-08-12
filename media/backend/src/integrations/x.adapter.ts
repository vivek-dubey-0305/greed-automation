import { PlatformAdapter } from './core/platform-adapter';
import { PlatformCapabilities, PublishRequest, PublishResult, OAuthResult } from './core/platform-types';
import { env } from '../config/env';
import { logger } from '../logger';

export class XAdapter implements PlatformAdapter {
  platform = 'x';
  capabilities: PlatformCapabilities = {
    supportsImagePost: true,
    supportsVideo: true,
    supportsMultipleImages: true,
    supportsTextOnly: true,
    supportsOAuth: true,
    supportsScheduling: false,
    supportsPostStatus: true,
    supportsDrafts: false,
    supportsDelete: true,
  };

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];
    // PKCE code challenge is required for X OAuth 2.0, assuming a static challenge for demo purposes.
    // In production, the backend should generate and store this per request.
    const codeChallenge = 'challenge';
    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${env.X_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join('%20')}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`;
  }

  async handleOAuthCallback(code: string, redirectUri: string): Promise<OAuthResult> {
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: 'challenge' // Must match the challenge above
      })
    });

    const tokenData = await tokenRes.json() as any;
    if (!tokenRes.ok) {
      throw new Error(`X OAuth Error: ${tokenData.error_description || tokenData.error}`);
    }

    // Fetch user info
    const userRes = await fetch('https://api.twitter.com/2/users/me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json() as any;

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      externalAccountId: userData.data.id,
      displayName: userData.data.name,
      username: userData.data.username,
    };
  }

  validateMedia(mediaUrls: string[]): boolean {
    return mediaUrls.length <= 4; // X allows up to 4 images
  }

  validateContent(content: string, hashtags?: string[]): boolean {
    return content.length <= 280; // Standard X limits
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    logger.info({ campaignId: request.campaignId }, 'Publishing to X...');

    try {
      // POST /2/tweets
      const payload = {
        text: request.content,
        // Media involves a complex v1.1 upload flow before v2 tweet creation.
        // For MVP, if media exists, append the link to the text if Cloudinary hosted.
      };

      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json() as any;
      if (!res.ok) {
        throw new Error(`X Publish Error: ${data.detail || JSON.stringify(data)}`);
      }

      return {
        success: true,
        externalId: data.data.id,
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'X Publish failed');
      return {
        success: false,
        error: error.message,
        retryable: true
      };
    }
  }
}
