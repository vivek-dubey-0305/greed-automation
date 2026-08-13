import { PlatformAdapter } from './core/platform-adapter';
import { PlatformCapabilities, PublishRequest, PublishResult, OAuthResult } from './core/platform-types';
import { env } from '../config/env';
import { logger } from '../logger';

export class MetaAdapter implements PlatformAdapter {
  platform: string;
  capabilities: PlatformCapabilities = {
    supportsImagePost: true,
    supportsVideo: true,
    supportsMultipleImages: true,
    supportsTextOnly: false, // Instagram requires media
    supportsOAuth: true,
    supportsScheduling: false,
    supportsPostStatus: true,
    supportsDrafts: false,
    supportsDelete: true,
  };

  constructor(platform: 'instagram' | 'facebook') {
    this.platform = platform;
    if (platform === 'facebook') {
      this.capabilities.supportsTextOnly = true;
    }
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const scopes = this.platform === 'instagram' 
      ? ['instagram_basic', 'instagram_content_publish', 'pages_show_list']
      : ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'];
      
    // Using standard Facebook Login for Business flow
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopes.join(',')}`;
  }

  async handleOAuthCallback(code: string, redirectUri: string): Promise<OAuthResult> {
    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${env.META_APP_SECRET}&code=${code}`);
    const tokenData = await tokenRes.json() as any;
    
    if (!tokenRes.ok) {
      throw new Error(`Meta OAuth Error: ${tokenData.error?.message || 'Unknown error'}`);
    }

    // 2. Exchange short-lived token for long-lived token
    const longLivedRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${env.META_APP_ID}&client_secret=${env.META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`);
    const longLivedData = await longLivedRes.json() as any;

    if (!longLivedRes.ok) {
      throw new Error(`Meta Exchange Error: ${longLivedData.error?.message || 'Unknown error'}`);
    }

    const accessToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in; // usually ~60 days

    // 3. Fetch user / page / ig_user info depending on platform
    // For MVP we assume we are getting the user's primary page/IG account
    const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
    const accountsData = await accountsRes.json() as any;

    if (!accountsRes.ok || !accountsData.data || accountsData.data.length === 0) {
      throw new Error(`Meta Account Error: Could not find any Facebook Pages linked to this user.`);
    }

    // Just take the first page for MVP
    const page = accountsData.data[0];
    const pageId = page.id;
    const pageAccessToken = page.access_token;
    const pageName = page.name;

    if (this.platform === 'facebook') {
      return {
        accessToken: pageAccessToken,
        expiresIn,
        externalAccountId: pageId,
        displayName: pageName,
        username: pageName,
      };
    } else {
      // Instagram: Get the linked IG Business Account
      const igRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`);
      const igData = await igRes.json() as any;
      
      if (!igRes.ok || !igData.instagram_business_account) {
        throw new Error(`Meta Account Error: Could not find a linked Instagram Business Account for page ${pageName}.`);
      }

      return {
        accessToken: pageAccessToken, // IG API uses the Page access token
        expiresIn,
        externalAccountId: igData.instagram_business_account.id,
        displayName: `${pageName} (Instagram)`,
        username: pageName,
      };
    }
  }

  validateMedia(mediaUrls: string[]): boolean {
    if (this.platform === 'instagram' && mediaUrls.length === 0) return false;
    return mediaUrls.length <= 10; // IG allows 10 for carousel
  }

  validateContent(content: string, hashtags?: string[]): boolean {
    return content.length <= 2200; // IG caption limit
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    logger.info({ campaignId: request.campaignId }, `Publishing to ${this.platform}...`);

    try {
      if (this.platform === 'instagram') {
        // IG Graph API requires a 2-step process for media:
        // 1. Create media container
        // 2. Publish media container
        
        // For MVP, if no media, we fail (IG requires media)
        if (!request.mediaUrls.length) {
          throw new Error('Instagram requires at least one image/video.');
        }

        const containerRes = await fetch(`https://graph.facebook.com/v19.0/${request.socialAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: request.mediaUrls[0], // MVP: Single image
            caption: request.content,
            access_token: request.accessToken
          })
        });

        const containerData = await containerRes.json() as any;
        console.log(`\n==============\n [META] IG Container Create API Response \n==============\n`, JSON.stringify(containerData, null, 2), `\n==============\n`);
        if (!containerRes.ok) throw new Error(containerData.error?.message);

        const publishRes = await fetch(`https://graph.facebook.com/v19.0/${request.socialAccountId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerData.id,
            access_token: request.accessToken
          })
        });

        const publishData = await publishRes.json() as any;
        console.log(`\n==============\n [META] IG Media Publish API Response \n==============\n`, JSON.stringify(publishData, null, 2), `\n==============\n`);
        if (!publishRes.ok) throw new Error(publishData.error?.message);

        return { success: true, externalId: publishData.id };
      } else {
        // Facebook Page Post
        const fbRes = await fetch(`https://graph.facebook.com/v19.0/${request.socialAccountId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: request.content,
            link: request.mediaUrls[0],
            access_token: request.accessToken
          })
        });

        const fbData = await fbRes.json() as any;
        console.log(`\n==============\n [META] FB Feed Publish API Response \n==============\n`, JSON.stringify(fbData, null, 2), `\n==============\n`);
        if (!fbRes.ok) throw new Error(fbData.error?.message);

        return { success: true, externalId: fbData.id };
      }

    } catch (error: any) {
      console.log(`\n==============\n [META] Publish Error \n==============\n`, error.message, `\n==============\n`);
      logger.error({ error: error.message }, `${this.platform} Publish failed`);
      return {
        success: false,
        error: error.message,
        retryable: true
      };
    }
  }
}
