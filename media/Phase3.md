Phase 3 target

By the end of Phase 3:

Expo
↓
Backend
↓
Campaign
↓
AI-generated content
↓
Platform Adapter
↓
OAuth / Platform API
↓
Publish
↓
Platform response
↓
Publish Attempt
↓
Automation Event
↓
Mobile status

And each platform remains isolated:

                  Publisher
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓

Instagram LinkedIn X
Adapter Adapter Adapter
↓ ↓ ↓
Instagram API LinkedIn API X API
====================================================================================================
PHASE 3A — SOCIAL INTEGRATION ARCHITECTURE

We are now beginning PHASE 3 of Greed Social.

PHASE 1:
Expo/React Native mobile application

PHASE 2:
Node.js backend, PostgreSQL, Cloudinary, Redis/BullMQ, campaign domain, automation engine and AI abstraction

Now implement the production social-platform integration architecture.

IMPORTANT:

Do NOT immediately implement individual platforms.

First build the integration framework that all platforms will use.

PRIMARY PRINCIPLE

The campaign and automation domain must NOT know implementation details of Instagram, Facebook, LinkedIn, X or YouTube.

Use an adapter/provider architecture.

Conceptually:

Automation Engine
↓
Publishing Service
↓
Platform Integration Registry
↓
Platform Adapter
↓
Official Platform API

ARCHITECTURE

Create:

src/integrations/
core/
platform-adapter.ts
platform-types.ts
platform-errors.ts
platform-registry.ts

instagram/
facebook/
linkedin/
x/
youtube/

Each adapter must implement a common interface.

CONCEPTUAL INTERFACE

A platform adapter should support operations such as:

getAuthorizationUrl()
handleOAuthCallback()
refreshAccessToken()
disconnectAccount()

validateMedia()
validateContent()

createDraft() where supported
publish()
getPublishStatus() where supported

Do NOT assume every platform supports every operation.

Capabilities must be explicit.

PLATFORM CAPABILITIES

Create a capability model.

Examples:

supportsImagePost
supportsVideo
supportsMultipleImages
supportsTextOnly
supportsScheduling
supportsPostStatus
supportsOAuth
supportsDelete
supportsDrafts

The system must check capabilities before attempting unsupported operations.

Do not hardcode capability checks throughout controllers.

ACCOUNT MODEL

A social account belongs to a Greed Social user.

Conceptually:

User
↓
SocialAccount
↓
Platform
↓
Platform credentials/tokens

Store:

id
userId
platform
externalAccountId
displayName
username where available
access token reference
refresh token reference where applicable
token expiry
scopes
status
createdAt
updatedAt

IMPORTANT SECURITY

Never return access tokens or refresh tokens to the Expo application.

The mobile app should only receive safe account metadata.

TOKEN STORAGE

Do not store raw long-lived credentials in logs.

Use an abstraction for token storage so encryption/secrets management can be improved later.

Do not build a custom cryptographic system unnecessarily.

OAUTH STATE

OAuth must protect against CSRF/state attacks.

Generate and validate a secure state value.

Do not trust arbitrary callback parameters.

CALLBACK FLOW

Conceptually:

Mobile
↓
Backend authorization endpoint
↓
Platform authorization
↓
Backend callback
↓
Validate OAuth state
↓
Exchange authorization code
↓
Store credentials securely
↓
Create SocialAccount
↓
Redirect/deep-link back to mobile

Do not expose platform client secrets to Expo.

PLATFORM REGISTRY

Create one registry that maps:

instagram → InstagramAdapter
facebook → FacebookAdapter
linkedin → LinkedInAdapter
x → XAdapter
youtube → YouTubeAdapter

The automation engine should request an adapter through the registry.

Example conceptual:

registry.get(platform)

No switch statement with platform-specific publishing logic should be scattered through the codebase.

ERROR SYSTEM

Extend the existing application error model with integration-specific errors:

OAUTH_FAILED
TOKEN_EXPIRED
TOKEN_REFRESH_FAILED
PLATFORM_AUTH_REQUIRED
PLATFORM_PERMISSION_DENIED
PLATFORM_RATE_LIMITED
PLATFORM_VALIDATION_FAILED
PLATFORM_MEDIA_UNSUPPORTED
PLATFORM_API_ERROR
PLATFORM_PUBLISH_FAILED
PLATFORM_PUBLISH_STATUS_UNKNOWN

Every integration error must indicate whether retrying is safe.

IDEMPOTENCY

Publishing must be idempotent.

The system must protect against:

HTTP request retry
BullMQ retry
worker restart
network timeout after successful external publish
user pressing publish twice

Never assume:

"request failed = platform did not publish."

Persist publish attempts and external IDs where available.

LOGGING

Every integration operation must log:

requestId
campaignId
platformPostId
socialAccountId
operation
attempt
duration
result

Never log:

- access tokens
- refresh tokens
- client secrets
- authorization codes

TESTING

Before implementing real platforms:

Create a MockPlatformAdapter.

Use it to test:

- success
- failure
- rate limit
- expired token
- timeout
- duplicate publish
- partial campaign failure
- retry

# Do not proceed to individual platform implementation until the integration framework works.

====================================================================================================
PHASE 3B — SOCIAL ACCOUNT CONNECTION AND OAUTH

Implement the backend account-connection system for Greed Social.

IMPORTANT:

Users must connect their social accounts before publishing.

The mobile app must NEVER receive platform client secrets or raw access/refresh tokens.

FLOW

Mobile:
"Connect Instagram"

↓

Backend:
create authorization URL

↓

Platform OAuth

↓

Backend callback

↓

Validate state

↓

Exchange code

↓

Retrieve account information

↓

Persist SocialAccount

↓

Return safe account information to mobile

MOBILE RESPONSE

Return only safe information such as:

id
platform
displayName
username
profileImage
status
connectedAt

Never return:
accessToken
refreshToken
clientSecret
authorizationCode

DATABASE

Use the existing SocialAccount model from Phase 3A.

Add appropriate indexes and unique constraints.

A user should not accidentally create duplicate connections for the same external account.

OAUTH STATE

Create a secure temporary OAuth state mechanism.

State must:

- be cryptographically strong
- have an expiration
- be associated with the initiating user
- be invalidated after use

Do not trust a user ID supplied by the callback.

TOKEN EXPIRATION

Store expiry metadata where the platform provides it.

Create:

TokenService

Responsibilities:

getValidAccessToken()
refreshAccessToken()
invalidateToken()

The rest of the application should not manipulate raw tokens.

TOKEN REFRESH

If the platform supports refresh tokens:

attempt refresh before publishing when the token is expired/near expiry.

If refresh fails:

mark the account as requiring reauthorization.

Do not continuously retry invalid credentials.

DISCONNECT

Implement:

disconnectSocialAccount()

Safely invalidate/remove stored credentials according to platform requirements.

Keep historical publish records where useful for auditability.

Do not delete campaign history simply because a social account is disconnected.

ERROR HANDLING

Handle:

- user denies OAuth
- invalid state
- expired state
- code exchange failure
- missing permissions
- token refresh failure
- platform unavailable

Map them to the existing error system.

TEST

Create mocked OAuth tests for:

successful connection
invalid state
expired state
denied authorization
code exchange failure
expired token
refresh success
refresh failure
disconnect

# Do not depend entirely on live platform credentials for automated tests.

# ====================================================================================================

PHASE 3C — META INTEGRATION: INSTAGRAM + FACEBOOK

Implement real Meta platform integrations for Greed Social.

IMPORTANT:

Use the currently supported official Meta APIs and OAuth flow.

Before implementation, inspect the current official Meta developer documentation and verify the exact API requirements, permissions, supported publishing capabilities and account restrictions.

Do not rely on outdated tutorials.

PLATFORM SEPARATION

Even though Instagram and Facebook may share Meta infrastructure:

InstagramAdapter
FacebookAdapter

must remain separate.

Do not create one giant MetaPublisher class containing all business logic.

INSTAGRAM

Implement the currently supported publishing workflow for eligible Instagram accounts.

Support the capabilities that are officially available and appropriate for the selected account type.

Before coding, verify:

- eligible account types
- required permissions
- media requirements
- image/video requirements
- carousel support
- publishing workflow
- status handling
- rate limits

Do not assume personal accounts support the same functionality as professional accounts.

FACEBOOK

Verify current supported publishing capabilities for:

- Pages
- required permissions
- media types
- publishing workflow
- status

Do not imply that arbitrary personal-profile posting is supported if the official API does not permit it.

MEDIA

The system should use Cloudinary assets.

Where a platform requires a publicly accessible media URL:

Cloudinary
↓
secure media URL
↓
platform API

Do not download and unnecessarily proxy large media files through Node if the platform can consume the Cloudinary URL directly.

VALIDATION

The adapter must validate:

- account eligibility
- media type
- media count
- content requirements
- platform capability

before publishing.

PUBLISH FLOW

Conceptually:

PlatformPost
↓
Validate
↓
Get SocialAccount
↓
Get valid access token
↓
Prepare media
↓
Platform API
↓
Persist external ID
↓
Persist PublishAttempt
↓
Update PlatformPost
↓
Emit AutomationEvent

FAILURE

Handle:

- permission failure
- invalid token
- expired token
- unsupported media
- rate limit
- platform rejection
- network timeout
- unknown publish status

Do not automatically retry errors that could duplicate a post.

TESTING

Create mocked adapter tests.

Then perform controlled live development-account testing if credentials and eligible accounts are available.

Verify:

- OAuth
- account connection
- media upload/publish
- response handling
- status persistence
- duplicate protection
- failure handling

# Do not claim production readiness until live behavior is verified against the current official API.

====================================================================================================
PHASE 3D — LINKEDIN INTEGRATION

Implement the LinkedIn integration using the currently supported official LinkedIn APIs.

Before implementation:

Verify current official documentation for:

- OAuth
- required scopes
- member/profile posting
- organization/page posting
- image/media publishing
- API version requirements
- permissions/review requirements
- rate limits

Do not rely on old LinkedIn tutorials.

IMPLEMENT

LinkedInAdapter implementing the common PlatformAdapter interface.

ACCOUNT CONNECTION

Support OAuth through the centralized OAuth system.

Store:

- external member/account ID
- safe display information
- token metadata
- scopes

Never expose tokens to mobile.

CONTENT

LinkedIn content should use the content generated for LinkedIn by the AI layer.

Do not regenerate content inside the LinkedIn adapter.

The adapter's responsibility is:

- validation
- transformation to LinkedIn API format
- publishing
- response handling

MEDIA

Use Cloudinary-hosted assets where compatible with the official API flow.

Handle the platform's required media-registration/upload flow correctly.

Do not assume a direct image URL is always sufficient.

PUBLISHING

Persist:

- publish attempt
- external post ID where available
- timestamps
- response status

ERRORS

Handle:

- authorization
- insufficient permissions
- expired token
- unsupported content
- media errors
- rate limits
- API failures

IDEMPOTENCY

Protect against duplicate LinkedIn posts after:

- timeout
- worker retry
- process restart

TEST:

Mock tests first.

Then live test against an appropriate development/test account if available.

# Verify the complete flow.

====================================================================================================
PHASE 3E — X/TWITTER INTEGRATION

Implement the X platform integration using the currently supported official X APIs.

Before coding, verify the current official API:

- authentication method
- OAuth flow
- scopes
- posting endpoint
- media upload requirements
- API access level
- rate limits
- pricing/access restrictions

Do not assume older Twitter API examples remain valid.

IMPLEMENT:

XAdapter

Capabilities should accurately represent current supported functionality.

CONTENT

Use the platform-specific generated content from the AI layer.

Validate:

- text length
- media requirements
- hashtag usage
- supported media formats

MEDIA

If media requires a separate upload process:

- upload media
- receive media identifier
- create post referencing the media

Do not store platform-specific media IDs as if they were Cloudinary IDs.

Keep them separate.

PUBLISHING

Persist:

- publish attempt
- external post ID
- timestamps
- response
- failure information

ERRORS

Handle:

- authentication
- insufficient access
- rate limits
- invalid content
- media upload failure
- network timeout
- unknown external status

IDEMPOTENCY

Do not blindly retry a publish after an ambiguous timeout.

Use the safest mechanism available from the current API.

TEST:

- mock adapter
- validation tests
- failure tests
- retry tests
- live development testing where access permits

===================================================================================================
PHASE 3F — YOUTUBE INTEGRATION

Implement YouTube as a platform adapter while respecting its fundamentally different content model.

Before implementation, verify the current official YouTube Data API requirements.

IMPORTANT:

Do not pretend YouTube is identical to Instagram/LinkedIn/X.

YouTube may involve:

- video upload
- title
- description
- tags
- category
- privacy status
- thumbnail
- channel selection

Determine which capabilities are appropriate for the current Greed Social MVP.

ARCHITECTURE

YouTubeAdapter implements the common platform interface but may expose platform-specific capabilities.

The common system must not force an image-only workflow onto YouTube.

If the current campaign only contains images and no supported video representation exists:

return a clear capability/validation state:

"Video content is required for YouTube publishing."

Do not fake a YouTube publish.

OAUTH

Implement the appropriate Google OAuth flow using the centralized OAuth architecture.

Store:

- channel/account ID
- channel name
- safe metadata
- token metadata

Never expose tokens to mobile.

CONTENT

Map AI-generated content into:

title
description
tags

where appropriate.

MEDIA

Use Cloudinary where compatible with the upload flow.

If video processing is needed, keep it as a separate capability rather than polluting the image workflow.

TEST:

Mock:

- channel connection
- upload
- successful publish
- failure
- token refresh

Live-test with a controlled channel if credentials are available.

====================================================================================================
PHASE 3G — EXPO SOCIAL ACCOUNT CONNECTION UI

Integrate the social account connection experience into the existing Expo application.

IMPORTANT:

The mobile application must never contain:

- platform client secrets
- access tokens
- refresh tokens

The mobile application communicates with the backend OAuth endpoints.

SETTINGS / CONNECTED ACCOUNTS

Create:

Connected Accounts

Display:

Instagram
Connected / Not connected

Facebook
Connected / Not connected

LinkedIn
Connected / Not connected

X
Connected / Not connected

YouTube
Connected / Not connected

Each account should display:

- platform
- account name
- username/channel/page where available
- connection status
- connect/disconnect action

CONNECT FLOW

User taps Connect.

Mobile:
↓
Backend authorization endpoint
↓
OAuth provider
↓
Backend callback
↓
Backend stores credentials
↓
Mobile receives safe connection result

Use the appropriate Expo/browser/deep-link mechanism for the OAuth flow.

Do not embed client secrets in Expo.

HANDLE:

- user cancellation
- OAuth failure
- invalid state
- backend failure
- account already connected
- token refresh required

SHOW CLEAR FEEDBACK

Success:
"LinkedIn connected successfully."

Warning:
"Your connection needs to be renewed."

Error:
"Unable to connect Instagram."

DISCONNECT

Ask for confirmation before disconnecting.

Do not delete campaign history.

After connection/disconnection:
refresh account state.

Do not hardcode account status locally as the source of truth.

The backend is the source of truth.

TEST:

- connect
- cancel
- failed OAuth
- connected state
- disconnect
- reconnect
- expired connection

====================================================================================================
PHASE 3H — CONNECT REAL PUBLISHING TO AUTOMATION ENGINE

Now connect the completed platform adapters to the Phase 2 automation engine.

IMPORTANT:

Do not rewrite the automation engine.

Use the PlatformAdapter registry created in Phase 3A.

FLOW

Mobile:
Approve LinkedIn + Instagram + X

↓

Backend:
approvePlatform()

↓

AutomationService

↓

BullMQ publishing job

↓

PublishingWorker

↓

PlatformRegistry.get(platform)

↓

PlatformAdapter.publish()

↓

External platform

↓

Persist PublishAttempt

↓

Update PlatformPost

↓

Emit AutomationEvent

↓

Update Campaign aggregate status

STATUS EXAMPLE

Instagram:
PUBLISHING → SUCCESS

LinkedIn:
PUBLISHING → SUCCESS

X:
PUBLISHING → FAILED

Campaign:

PARTIALLY_COMPLETED

When X is retried:

X:
RETRYING → PUBLISHING → SUCCESS

Campaign:

COMPLETED

IMPORTANT:

A failure in one platform must not cancel unrelated platform jobs.

Each platform publication must have its own job/attempt identity.

IDEMPOTENCY

Before publishing:
check whether the platform post already has a confirmed external publish ID.

If yes:
do not publish again.

If status is ambiguous:
do not blindly duplicate the post.

Use the safest platform-specific reconciliation strategy available.

RETRY

Only retry when the error is classified as retryable.

Manual retry should create a new publish attempt while preserving previous attempts.

Do not overwrite historical failures.

AUDIT

Store every important event.

Example:

PUBLISH_REQUESTED
PUBLISH_STARTED
PUBLISH_SUCCEEDED
PUBLISH_FAILED
PUBLISH_RETRY_REQUESTED
PUBLISH_RETRY_STARTED
PUBLISH_RETRY_SUCCEEDED

LOG CORRELATION

Every operation should be traceable using:

requestId
campaignId
automationRunId
platformPostId
publishAttemptId
jobId
socialAccountId

Do not log secrets.

TEST:

1. all platforms succeed
2. one fails
3. two fail
4. retry succeeds
5. retry fails
6. token expired
7. rate limited
8. platform unavailable
9. worker restarted
10. duplicate request
11. ambiguous timeout

Run complete integration tests before declaring Phase 3 complete.

===================================================================================================
PHASE 3I — COMPLETE EXPO ↔ BACKEND INTEGRATION

Replace the relevant Phase 1 mock services with the real backend services.

IMPORTANT:

Do not rewrite UI components unnecessarily.

The service abstraction was intentionally created in Phase 1.

Replace:

MockCampaignService
MockMediaService
MockAutomationService

with:

RealCampaignService
RealMediaService
RealAutomationService

FLOW

Expo
↓
API Client
↓
Node backend
↓
PostgreSQL / Cloudinary / Redis / AI
↓
Social integrations

IMPLEMENT REAL FLOWS:

1. create campaign
2. upload images
3. create campaign
4. select platforms
5. generate content
6. retrieve generated platform posts
7. edit content
8. approve platform
9. publish
10. monitor status
11. retry failure

MOBILE STATUS

The mobile UI must consume backend state.

Do not invent local success states when a backend operation is still processing.

The backend is the source of truth.

STATUS UPDATES

Initially implement reliable polling if necessary.

Prepare the architecture so realtime updates can later be introduced.

Do not introduce WebSockets/SSE merely for complexity unless justified.

POLLING

Use:

- sensible interval
- stop polling when terminal state is reached
- exponential backoff where appropriate
- cleanup when screen unmounts

Do not poll indefinitely.

ERROR HANDLING

Map backend error categories into mobile UI states.

Examples:

NETWORK
→ "Check your internet connection."

AUTHENTICATION
→ "Please reconnect your social account."

RATE_LIMIT
→ "This platform is temporarily rate-limited."

PLATFORM_PERMISSION
→ "Additional permission is required."

RETRYABLE
→ show Retry

NON_RETRYABLE
→ explain required action

REQUEST ID

Display a user-friendly error but retain request ID internally for debugging.

DEVELOPMENT LOGGING

Allow development logs to show:

request
response
duration
requestId
campaignId
platform

Never log credentials/tokens.

TEST COMPLETE USER JOURNEY

Home
→ Create Campaign
→ Add Images
→ Enter Instruction
→ Select Instagram + LinkedIn + X
→ Generate
→ Review
→ Edit
→ Approve
→ Publish
→ Monitor
→ Simulate/fetch actual platform statuses
→ Handle success/failure
→ Retry

Fix all issues before completing.

===================================================================================================
PHASE 3J — SOCIAL INTEGRATION SECURITY AND RELIABILITY AUDIT

Do not add new product features.

Audit the entire Greed Social social integration implementation.

SECURITY

Verify:

1. No platform client secrets exist in Expo.
2. No access tokens are returned to mobile.
3. No refresh tokens are returned to mobile.
4. OAuth state is validated.
5. OAuth state expires.
6. OAuth callback cannot be used to attach an account to another user.
7. Credentials are not logged.
8. Authorization checks exist for social accounts.
9. Users cannot publish using another user's social account.
10. Campaign ownership is verified.
11. Platform post ownership is verified.
12. Publish attempt ownership is verified.
13. Environment secrets are server-side only.
14. Production CORS is restricted.
15. Rate limiting exists where appropriate.
16. Request body limits exist.
17. External URLs are validated where needed.

RELIABILITY

Test:

- token expiration
- refresh failure
- platform API timeout
- platform rate limit
- duplicate publish
- worker restart
- Redis failure
- database failure
- Cloudinary failure
- partial platform success
- ambiguous external response

IDEMPOTENCY

Attempting to publish the same platform post twice must not blindly create duplicate content.

RETRY SAFETY

Every retryable error must actually be safe to retry.

Do not classify all external API errors as retryable.

OBSERVABILITY

Verify that a failed operation can be traced through:

requestId
→ campaignId
→ automationRunId
→ jobId
→ platformPostId
→ publishAttemptId
→ socialAccountId

DATABASE

Verify:

- foreign keys
- indexes
- unique constraints
- no orphan records
- publish history retained
- automation history retained

MOBILE

Verify:

- no secrets bundled
- no credentials logged
- OAuth deep links work
- connection state refreshes
- publishing states display correctly
- partial failures display correctly
- retry works

TESTING

Run:

- unit tests
- integration tests
- OAuth tests
- adapter tests
- queue tests
- database tests
- end-to-end tests

Use mocks for external APIs in automated tests.

Use controlled live accounts for final integration verification.

Do not claim "production ready" if a platform has not been verified against its current official API requirements.

Provide a final report containing:

- vulnerabilities found
- reliability problems found
- fixes made
- tests executed
- external platform limitations
- # remaining production blockers

One very important addition: don't force all platforms into one identical flow

Your product should conceptually have:

                    Campaign
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Instagram     LinkedIn        X
          │            │            │
      image/text    image/text     text/media
          │            │            │
       publish      publish       publish

But YouTube might be:

Campaign
│
▼
YouTube
│
├── video required
├── title
├── description
├── tags
└── thumbnail

And that's good architecture, not a problem.

Your AI layer can generate the right content structure:

Campaign
↓
AI
↓
┌──────────────────────────────┐
│ PlatformContent │
│ │
│ Instagram │
│ caption + hashtags │
│ │
│ LinkedIn │
│ caption + hashtags │
│ │
│ X │
│ text + media │
│ │
│ YouTube │
│ title + description + tags │
└──────────────────────────────┘

Then the adapter decides how to publish it.

Your Phase 3 completion target

At the end of all these prompts, you should be able to demonstrate:

                    GREED SOCIAL

                       Mobile
                         │
                         ▼
                  Create Campaign
                         │
                  Select 3 images
                         │
                  "Promote our AI
                    workshop"
                         │
                         ▼
                    AI Content
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
         Instagram    LinkedIn       X
             │           │           │
             ▼           ▼           ▼
         Preview      Preview      Preview
             │           │           │
             └───────────┼───────────┘
                         ▼
                       Approve
                         │
                         ▼
                     BullMQ
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
         Instagram    LinkedIn       X
          SUCCESS      SUCCESS      FAILED
                                      │
                                      ▼
                                    RETRY
                                      │
                                      ▼
                                    SUCCESS
                         │
                         ▼
                     COMPLETED
