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
      const isMultiple = request.mediaUrls && request.mediaUrls.length > 0;
      const mediaAssets: any[] = [];

      // If we have media, upload each one to LinkedIn
      if (isMultiple) {
        for (const url of request.mediaUrls) {
          // 1. Fetch image buffer from url
          const imageRes = await fetch(url);
          if (!imageRes.ok) throw new Error(`Failed to fetch image from URL: ${url}`);
          const arrayBuffer = await imageRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // 2. Register Upload
          const registerPayload = {
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: request.socialAccountId,
              serviceRelationships: [
                {
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent'
                }
              ]
            }
          };

          const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${request.accessToken}`,
              'Content-Type': 'application/json',
              'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify(registerPayload)
          });

          const registerData = await registerRes.json() as any;
          if (!registerRes.ok) throw new Error(`LinkedIn Register Upload Error: ${registerData.message || JSON.stringify(registerData)}`);

          const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
          const assetUrn = registerData.value.asset;

          // 3. Upload Buffer
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${request.accessToken}`,
            },
            body: buffer
          });

          if (!uploadRes.ok) throw new Error(`LinkedIn Image Upload Failed`);
          
          mediaAssets.push({
            status: 'READY',
            description: { text: request.content.substring(0, 200) },
            media: assetUrn,
            title: { text: 'Image' }
          });
        }
      }

      const payload: any = {
        author: request.socialAccountId,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: request.content
            },
            shareMediaCategory: isMultiple ? 'IMAGE' : 'NONE',
            ...(isMultiple ? { media: mediaAssets } : {})
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

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
        retryable: true
      };
    }
  }
}
