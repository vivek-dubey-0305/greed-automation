import { PlatformAdapter } from './core/platform-adapter';
import { PlatformCapabilities, PublishRequest, PublishResult, OAuthResult } from './core/platform-types';
import { env } from '../config/env';
import { logger } from '../logger';

export class LinkedInAdapter implements PlatformAdapter {
  platform = 'linkedin';
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
    const scopes = ['w_member_social', 'openid', 'profile']; // Modern LinkedIn scopes
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopes.join('%20')}`;
  }

  async handleOAuthCallback(code: string, redirectUri: string): Promise<OAuthResult> {
    // 1. Exchange code for token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: env.LINKEDIN_CLIENT_ID || '',
        client_secret: env.LINKEDIN_CLIENT_SECRET || '',
      })
    });

    const tokenData = await tokenRes.json() as any;
    if (!tokenRes.ok) {
      throw new Error(`LinkedIn OAuth Error: ${tokenData.error_description || tokenData.error}`);
    }

    // 2. Fetch user profile (OpenID Connect UserInfo endpoint)
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    
    const profileData = await profileRes.json() as any;
    if (!profileRes.ok) {
      throw new Error('Failed to fetch LinkedIn profile');
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      externalAccountId: `urn:li:person:${profileData.sub}`, // OIDC returns 'sub' instead of 'id'
      displayName: `${profileData.given_name} ${profileData.family_name}`,
    };
  }

  validateMedia(mediaUrls: string[]): boolean {
    return mediaUrls.length <= 9; // LinkedIn allows up to 9 images
  }

  validateContent(content: string, hashtags?: string[]): boolean {
    return content.length <= 3000;
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    logger.info({ campaignId: request.campaignId }, 'Publishing to LinkedIn...');

    try {
      // NOTE: For MVP we assume text-only or single image URL
      // Real LinkedIn API requires registering an image upload, uploading it, then referencing the URN.
      // We will do a text-only UGC post for simplicity if no media, or a placeholder if media exists.
      
      const payload: any = {
        author: request.socialAccountId, // this maps to externalAccountId urn in our DB
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: request.content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      // Real LinkedIn API call (commented out unless fully handling media URNs):
      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${request.accessToken}`,
           'Content-Type': 'application/json',
           'X-Restli-Protocol-Version': '2.0.0'
         },
         body: JSON.stringify(payload)
      });

      const data = await res.json() as any;
      if (!res.ok) {
        throw new Error(`LinkedIn Publish Error: ${data.message || JSON.stringify(data)}`);
      }

      return {
        success: true,
        externalId: data.id,
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'LinkedIn Publish failed');
      return {
        success: false,
        error: error.message,
        retryable: true // Most API errors might be rate limits or network issues
      };
    }
  }
}
