import { db } from '../db/client';
import { socialAccounts } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { PlatformRegistry } from '../integrations/core/platform-registry';
import { AppError } from '../errors/AppError';
import { logger } from '../logger';

export class TokenService {
  /**
   * Retrieves a valid access token. Attempts refresh if near expiry.
   */
  static async getValidAccessToken(socialAccountId: string): Promise<string> {
    const account = await db.query.socialAccounts.findFirst({
      where: eq(socialAccounts.id, socialAccountId),
    });

    if (!account) {
      throw new AppError({ code: 'not_found', message: 'Social account not found', category: 'NotFoundError', statusCode: 404 });
    }

    if (account.status !== 'CONNECTED') {
      throw new AppError({ code: 'auth_required', message: `Account is disconnected. Status: ${account.status}`, category: 'AuthenticationError', statusCode: 401 });
    }

    // Check expiry
    if (account.tokenExpiry && account.tokenExpiry < new Date(Date.now() + 5 * 60 * 1000)) { // buffer 5 mins
      logger.info({ socialAccountId }, 'Access token expired or expiring soon, attempting refresh...');
      return this.refreshAccessToken(account);
    }

    if (!account.accessToken) {
      throw new AppError({ code: 'auth_required', message: 'No access token available', category: 'AuthenticationError', statusCode: 401 });
    }

    return account.accessToken;
  }

  private static async refreshAccessToken(account: typeof socialAccounts.$inferSelect): Promise<string> {
    if (!account.refreshToken) {
      // Mark as requiring reauthorization
      await db.update(socialAccounts)
        .set({ status: 'REAUTHORIZATION_REQUIRED' })
        .where(eq(socialAccounts.id, account.id));
      throw new AppError({ code: 'auth_required', message: 'Token expired and no refresh token available. Reauthorization required.', category: 'AuthenticationError', statusCode: 401 });
    }

    try {
      const adapter = PlatformRegistry.get(account.platform);
      
      if (!adapter.refreshAccessToken) {
         throw new Error(`Platform ${account.platform} does not support token refresh`);
      }

      const refreshed = await adapter.refreshAccessToken(account.refreshToken);

      await db.update(socialAccounts).set({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? account.refreshToken,
        tokenExpiry: refreshed.expiresIn ? new Date(Date.now() + refreshed.expiresIn * 1000) : null,
      }).where(eq(socialAccounts.id, account.id));

      logger.info({ socialAccountId: account.id, platform: account.platform }, 'Token refreshed successfully');
      
      return refreshed.accessToken;
    } catch (error: any) {
      logger.error({ error: error.message, socialAccountId: account.id }, 'Token refresh failed');
      await db.update(socialAccounts)
        .set({ status: 'REAUTHORIZATION_REQUIRED' })
        .where(eq(socialAccounts.id, account.id));
      throw new AppError({ code: 'auth_required', message: 'Token refresh failed. Reauthorization required.', category: 'AuthenticationError', statusCode: 401 });
    }
  }

  static async disconnectAccount(userId: string, socialAccountId: string) {
    // Soft disconnect / invalidate local credential
    await db.update(socialAccounts)
      .set({ status: 'DISCONNECTED', accessToken: null, refreshToken: null })
      .where(and(eq(socialAccounts.id, socialAccountId), eq(socialAccounts.userId, userId)));
      
    // Ideally we would also call an adapter method to revoke the token on the platform side if supported.
  }
}
