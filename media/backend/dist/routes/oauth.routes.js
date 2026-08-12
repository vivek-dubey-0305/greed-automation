import { OAuthController } from '../controllers/oauth.controller';
export async function oauthRoutes(fastify) {
    fastify.get('/oauth/:platform/url', OAuthController.getAuthorizationUrl);
    fastify.get('/oauth/:platform/callback', OAuthController.handleCallback);
    fastify.get('/social-accounts', OAuthController.getConnectedAccounts);
    fastify.delete('/social-accounts/:id', OAuthController.disconnect);
}
