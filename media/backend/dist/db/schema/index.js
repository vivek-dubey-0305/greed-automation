import { pgTable, uuid, varchar, timestamp, text, jsonb, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const campaigns = pgTable('campaigns', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    instruction: text('instruction'),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const mediaAssets = pgTable('media_assets', {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
    publicId: varchar('public_id', { length: 255 }).notNull(),
    secureUrl: text('secure_url').notNull(),
    resourceType: varchar('resource_type', { length: 50 }).notNull(),
    format: varchar('format', { length: 50 }).notNull(),
    width: integer('width'),
    height: integer('height'),
    bytes: integer('bytes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const campaignPlatforms = pgTable('campaign_platforms', {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
    platform: varchar('platform', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const platformPosts = pgTable('platform_posts', {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignPlatformId: uuid('campaign_platform_id').references(() => campaignPlatforms.id).notNull(),
    content: text('content'),
    hashtags: jsonb('hashtags'),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const publishAttempts = pgTable('publish_attempts', {
    id: uuid('id').primaryKey().defaultRandom(),
    platformPostId: uuid('platform_post_id').references(() => platformPosts.id).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'),
    externalId: varchar('external_id', { length: 255 }),
    error: text('error'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const automationRuns = pgTable('automation_runs', {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const automationEvents = pgTable('automation_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    automationRunId: uuid('automation_run_id').references(() => automationRuns.id).notNull(),
    type: varchar('type', { length: 100 }).notNull(),
    details: jsonb('details'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Relationships
export const usersRelations = relations(users, ({ many }) => ({
    campaigns: many(campaigns),
}));
export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
    user: one(users, {
        fields: [campaigns.userId],
        references: [users.id],
    }),
    mediaAssets: many(mediaAssets),
    platforms: many(campaignPlatforms),
    automationRuns: many(automationRuns),
}));
export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
    campaign: one(campaigns, {
        fields: [mediaAssets.campaignId],
        references: [campaigns.id],
    }),
}));
export const campaignPlatformsRelations = relations(campaignPlatforms, ({ one, many }) => ({
    campaign: one(campaigns, {
        fields: [campaignPlatforms.campaignId],
        references: [campaigns.id],
    }),
    posts: many(platformPosts),
}));
export const platformPostsRelations = relations(platformPosts, ({ one, many }) => ({
    campaignPlatform: one(campaignPlatforms, {
        fields: [platformPosts.campaignPlatformId],
        references: [campaignPlatforms.id],
    }),
    attempts: many(publishAttempts),
}));
export const publishAttemptsRelations = relations(publishAttempts, ({ one }) => ({
    post: one(platformPosts, {
        fields: [publishAttempts.platformPostId],
        references: [platformPosts.id],
    }),
}));
export const automationRunsRelations = relations(automationRuns, ({ one, many }) => ({
    campaign: one(campaigns, {
        fields: [automationRuns.campaignId],
        references: [campaigns.id],
    }),
    events: many(automationEvents),
}));
export const automationEventsRelations = relations(automationEvents, ({ one }) => ({
    run: one(automationRuns, {
        fields: [automationEvents.automationRunId],
        references: [automationRuns.id],
    }),
}));
export const socialAccounts = pgTable('social_accounts', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    platform: varchar('platform', { length: 50 }).notNull(),
    externalAccountId: varchar('external_account_id', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    username: varchar('username', { length: 255 }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiry: timestamp('token_expiry'),
    scopes: jsonb('scopes'),
    status: varchar('status', { length: 50 }).notNull().default('CONNECTED'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const oauthStates = pgTable('oauth_states', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    platform: varchar('platform', { length: 50 }).notNull(),
    stateToken: varchar('state_token', { length: 255 }).notNull().unique(),
    redirectUri: varchar('redirect_uri', { length: 255 }),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const socialAccountsRelations = relations(socialAccounts, ({ one }) => ({
    user: one(users, {
        fields: [socialAccounts.userId],
        references: [users.id],
    }),
}));
