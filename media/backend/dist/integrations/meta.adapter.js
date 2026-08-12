import { env } from '../config/env';
import { logger } from '../logger';
export class MetaAdapter {
    platform;
    capabilities = {
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
    constructor(platform) {
        this.platform = platform;
        if (platform === 'facebook') {
            this.capabilities.supportsTextOnly = true;
        }
    }
    getAuthorizationUrl(state, redirectUri) {
        const scopes = this.platform === 'instagram'
            ? ['instagram_basic', 'instagram_content_publish', 'pages_show_list']
            : ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'];
        // Using standard Facebook Login for Business flow
        return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopes.join(',')}`;
    }
    async handleOAuthCallback(code, redirectUri) {
        // 1. Exchange code for short-lived token
        const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${env.META_APP_SECRET}&code=${code}`);
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
            throw new Error(`Meta OAuth Error: ${tokenData.error?.message || 'Unknown error'}`);
        }
        // 2. Exchange short-lived token for long-lived token
        const longLivedRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${env.META_APP_ID}&client_secret=${env.META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`);
        const longLivedData = await longLivedRes.json();
        if (!longLivedRes.ok) {
            throw new Error(`Meta Exchange Error: ${longLivedData.error?.message || 'Unknown error'}`);
        }
        const accessToken = longLivedData.access_token;
        const expiresIn = longLivedData.expires_in; // usually ~60 days
        // 3. Fetch user / page / ig_user info depending on platform
        // For MVP we assume we are getting the user's primary page/IG account
        const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${accessToken}`);
        const meData = await meRes.json();
        return {
            accessToken,
            expiresIn,
            externalAccountId: meData.id,
            displayName: meData.name,
            username: meData.name,
        };
    }
    validateMedia(mediaUrls) {
        if (this.platform === 'instagram' && mediaUrls.length === 0)
            return false;
        return mediaUrls.length <= 10; // IG allows 10 for carousel
    }
    validateContent(content, hashtags) {
        return content.length <= 2200; // IG caption limit
    }
    async publish(request) {
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
                const containerData = await containerRes.json();
                if (!containerRes.ok)
                    throw new Error(containerData.error?.message);
                const publishRes = await fetch(`https://graph.facebook.com/v19.0/${request.socialAccountId}/media_publish`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creation_id: containerData.id,
                        access_token: request.accessToken
                    })
                });
                const publishData = await publishRes.json();
                if (!publishRes.ok)
                    throw new Error(publishData.error?.message);
                return { success: true, externalId: publishData.id };
            }
            else {
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
                const fbData = await fbRes.json();
                if (!fbRes.ok)
                    throw new Error(fbData.error?.message);
                return { success: true, externalId: fbData.id };
            }
        }
        catch (error) {
            logger.error({ error: error.message }, `${this.platform} Publish failed`);
            return {
                success: false,
                error: error.message,
                retryable: true
            };
        }
    }
}
