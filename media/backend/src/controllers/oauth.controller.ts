import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { db } from '../db/client';
import { oauthStates, socialAccounts } from '../db/schema';
import { PlatformRegistry } from '../integrations/core/platform-registry';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../errors/AppError';
import { TokenService } from '../services/TokenService';
import { CampaignService } from '../services/CampaignService';

export class OAuthController {
  
  static async getAuthorizationUrl(req: FastifyRequest, reply: FastifyReply) {
    // Hardcode user id for MVP (or get from req.user if auth middleware existed)
    const userId = await CampaignService.getOrCreateDefaultUser();
    const { platform } = req.params as { platform: string };
    
    // Validate adapter exists
    const adapter = PlatformRegistry.get(platform);
    
    // Generate secure state
    const stateToken = crypto.randomBytes(32).toString('hex');
    
    // Use Render URL for production, or fallback for local
    const baseUrl = process.env.BACKEND_URL || 'https://greed-automation.onrender.com';
    const redirectUri = `${baseUrl}/api/oauth/${platform}/callback`;

    // Persist state
    await db.insert(oauthStates).values({
      userId,
      platform,
      stateToken,
      redirectUri,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    });

    const url = adapter.getAuthorizationUrl(stateToken, redirectUri);
    return reply.send({ url });
  }

  static async handleCallback(req: FastifyRequest, reply: FastifyReply) {
    const { platform } = req.params as { platform: string };
    const { code, state, error, error_description } = req.query as any;

    if (error) {
       // Deep link back to app with error
       return reply.redirect(`greedsocial://oauth?status=error&message=${encodeURIComponent(error_description || error)}`);
    }

    if (!code || !state) {
       return reply.redirect(`greedsocial://oauth?status=error&message=Missing_code_or_state`);
    }

    // Verify state
    const oauthState = await db.query.oauthStates.findFirst({
      where: and(eq(oauthStates.stateToken, state), eq(oauthStates.platform, platform)),
    });

    if (!oauthState) {
      return reply.redirect(`greedsocial://oauth?status=error&message=Invalid_State`);
    }

    if (oauthState.expiresAt < new Date()) {
      return reply.redirect(`greedsocial://oauth?status=error&message=State_Expired`);
    }

    try {
      const adapter = PlatformRegistry.get(platform);
      const authResult = await adapter.handleOAuthCallback(code, oauthState.redirectUri!);

      // Upsert social account
      const existing = await db.query.socialAccounts.findFirst({
        where: and(
          eq(socialAccounts.userId, oauthState.userId),
          eq(socialAccounts.platform, platform),
          eq(socialAccounts.externalAccountId, authResult.externalAccountId)
        )
      });

      if (existing) {
        await db.update(socialAccounts).set({
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken ?? existing.refreshToken,
          tokenExpiry: authResult.expiresIn ? new Date(Date.now() + authResult.expiresIn * 1000) : null,
          displayName: authResult.displayName,
          username: authResult.username,
          scopes: authResult.scopes,
          status: 'CONNECTED',
          updatedAt: new Date()
        }).where(eq(socialAccounts.id, existing.id));
      } else {
        await db.insert(socialAccounts).values({
          userId: oauthState.userId,
          platform,
          externalAccountId: authResult.externalAccountId,
          displayName: authResult.displayName,
          username: authResult.username,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          tokenExpiry: authResult.expiresIn ? new Date(Date.now() + authResult.expiresIn * 1000) : null,
          scopes: authResult.scopes,
          status: 'CONNECTED'
        });
      }

      // Cleanup state
      await db.delete(oauthStates).where(eq(oauthStates.id, oauthState.id));

      // Deep link to Expo success
      return reply.redirect(`greedsocial://oauth?status=success&platform=${platform}`);
    } catch (e: any) {
      req.log.error({ err: e.message, platform }, 'OAuth Callback Failed');
      return reply.redirect(`greedsocial://oauth?status=error&message=Code_Exchange_Failed`);
    }
  }

  static async getConnectedAccounts(req: FastifyRequest, reply: FastifyReply) {
    const userId = await CampaignService.getOrCreateDefaultUser();
    const accounts = await db.query.socialAccounts.findMany({
      where: eq(socialAccounts.userId, userId)
    });
    
    // NEVER return sensitive tokens to client
    const safeAccounts = accounts.map(a => ({
      id: a.id,
      platform: a.platform,
      displayName: a.displayName,
      username: a.username,
      status: a.status,
      connectedAt: a.createdAt,
    }));
    
    return reply.send({ accounts: safeAccounts });
  }

  static async disconnect(req: FastifyRequest, reply: FastifyReply) {
    const userId = await CampaignService.getOrCreateDefaultUser();
    const { id } = req.params as { id: string };
    await TokenService.disconnectAccount(userId, id);
    return reply.send({ success: true });
  }
}
