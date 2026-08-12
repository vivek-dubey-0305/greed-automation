Expo App
│
│ HTTPS
▼
┌──────────────────────────────┐
│ Node.js + TypeScript │
│ │
│ Routes / Controllers │
│ ↓ │
│ Validation │
│ ↓ │
│ Services │
│ ↓ │
│ Domain / Automation │
│ ↓ │
│ Repositories │
└──────────────┬───────────────┘
│
┌───────┼──────────┐
▼ ▼ ▼
PostgreSQL Cloudinary Redis
│
BullMQ
│
Workers

And the backend should be designed so the future social integrations plug into it cleanly:

Automation Engine
│
├── Instagram Adapter
├── Facebook Adapter
├── LinkedIn Adapter
├── X Adapter
└── YouTube Adapter

====================================================================================================
PHASE 2A — PRODUCTION BACKEND FOUNDATION

We are now beginning PHASE 2 of Greed Social.

The Expo/React Native mobile client has already been structured for backend integration.

Build the backend as a production-oriented Node.js + TypeScript application.

IMPORTANT:

This is a real application intended for eventual production deployment and Google Play Store distribution.

Do not build a throwaway tutorial backend.

TECH STACK

Use:

- Node.js
- TypeScript
- Fastify OR Express

Prefer Fastify if there is no existing backend constraint.

Database:

- PostgreSQL
- Drizzle ORM

File/media storage:

- Cloudinary

Queue:

- Redis
- BullMQ

Validation:

- Zod

Logging:

- structured logger such as Pino

Testing:

- Vitest or the project's existing testing framework

API documentation can be prepared for later, but do not spend excessive time on Swagger/OpenAPI during this phase.

ARCHITECTURE

Use a modular layered architecture.

Recommended structure:

src/
app/
app.ts
server.ts

config/
env.ts

routes/

controllers/

services/

domain/
campaigns/
automation/
media/
platforms/

repositories/

db/
schema/
migrations/
client.ts

integrations/
cloudinary/

queues/
workers/
jobs/

middleware/

errors/

logger/

validators/

types/

utils/

tests/

Do not create meaningless folders.
Each layer must have a clear responsibility.

RESPONSIBILITIES

Routes:

- define endpoints
- connect routes to controllers

Controllers:

- parse request
- invoke services
- return response
- no business logic

Services:

- business logic
- orchestration

Domain:

- core application rules
- campaign lifecycle
- automation state transitions

Repositories:

- database access only
- no HTTP logic
- no UI logic

Integrations:

- external services such as Cloudinary
- future social platforms

Queues:

- asynchronous jobs
- publishing
- retries
- long-running automation

CONFIGURATION

Create centralized environment configuration.

Validate environment variables at startup using Zod.

Potential variables:

NODE_ENV
PORT
DATABASE_URL
REDIS_URL

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

AI provider configuration should be abstracted and added later.

Never access process.env throughout the application.

Only the config layer should expose validated environment configuration.

ERROR HANDLING

Create a centralized application error system.

Support:

ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
ExternalServiceError
DatabaseError
RateLimitError
TimeoutError
AutomationError
UnknownError

Every error should have:

- code
- category
- message
- statusCode
- retryable
- cause where appropriate

Never expose stack traces or secrets to clients.

ERROR RESPONSE FORMAT

Use a consistent response:

{
"success": false,
"error": {
"code": "...",
"message": "...",
"category": "...",
"retryable": true
},
"requestId": "..."
}

SUCCESS RESPONSE FORMAT

Use:

{
"success": true,
"data": {},
"requestId": "..."
}

REQUEST ID

Every request must have a request ID.

Return it in:

- response
- logs
- error responses

This must allow us to trace a mobile request through the backend.

HEALTH ENDPOINT

Create:

GET /health

and preferably:

GET /health/ready

The readiness endpoint should verify required dependencies where appropriate.

Do not expose sensitive configuration.

SECURITY BASICS

Implement:

- secure headers where appropriate
- CORS configuration
- JSON/body limits
- request validation
- sensible timeouts
- no secrets in logs
- no raw database errors returned to clients

CORS

The mobile application is not a browser, so do not pretend CORS is an authentication/security boundary.

Still configure CORS appropriately because future web/admin clients may exist.

Do not use wildcard CORS in production configuration.

LOGGING

Implement structured logging.

Every request should record useful metadata such as:

requestId
method
path
statusCode
duration
environment

Log levels:

DEBUG
INFO
WARN
ERROR

Never log:

- access tokens
- refresh tokens
- passwords
- API secrets
- Cloudinary secrets
- complete private user content unnecessarily

DATABASE ERRORS

Create a centralized database error mapper.

Handle common PostgreSQL/Drizzle cases such as:

- unique constraint
- foreign key violation
- not-null violation
- invalid query
- connection failure

Convert them into safe application errors.

Do not leak raw PostgreSQL errors.

GRACEFUL SHUTDOWN

Handle:
SIGTERM
SIGINT

Gracefully close:

- HTTP server
- database connections
- Redis connections
- BullMQ workers

Do not leave jobs or connections hanging unnecessarily.

DO NOT IMPLEMENT YET:

- social APIs
- OAuth
- AI generation
- publishing
- Playwright
- real automation
- authentication

First establish a stable backend foundation.

After implementation:

- install dependencies
- run TypeScript
- run lint
- run tests
- start server
- test /health
- test /health/ready
- test validation failure
- test controlled application error
- test unknown error
- test database error mapping where possible

# Fix all issues before completing the phase.

====================================================================================================
PHASE 2B — PostgreSQL + Supabase

Since you're using Supabase, I'd use Supabase PostgreSQL rather than maintaining your own PostgreSQL server.

But let Drizzle remain your application ORM/migration layer.

That gives you:

Backend
↓
Drizzle
↓
PostgreSQL
↓
Supabase

PHASE 2B — DATABASE AND SUPABASE

Implement the production database layer for Greed Social using:

- Supabase PostgreSQL
- Drizzle ORM
- TypeScript

IMPORTANT:

Use the existing Supabase project if credentials/configuration are already available.

Do not create a second database unnecessarily.

DATABASE PRINCIPLES

The database must represent the domain cleanly and support:

- users
- campaigns
- media assets
- platform selections
- generated platform content
- automation executions
- publishing attempts
- statuses
- errors
- timestamps

INITIAL SCHEMA

Design relational tables approximately around:

users

campaigns

media_assets

campaign_platforms

platform_posts

automation_runs

automation_events

publish_attempts

Do not blindly copy these names if the existing codebase has a better established convention.

RELATIONSHIPS

User
↓
Campaign
↓
Media Assets

Campaign
↓
Campaign Platforms
↓
Platform Posts
↓
Publish Attempts

Campaign
↓
Automation Run
↓
Automation Events

IMPORTANT DOMAIN DISTINCTION

A campaign is the user's overall intention.

A platform post is the platform-specific representation.

A publish attempt is one actual attempt to publish that platform post.

An automation event is an immutable record of an important state transition.

This distinction is important for:

- retries
- debugging
- analytics
- partial failures
- auditability

IDs

Use UUIDs or another robust non-sequential identifier strategy.

Do not expose database internals unnecessarily.

TIMESTAMPS

Use consistent UTC timestamps.

Include:
createdAt
updatedAt

Where appropriate:
startedAt
completedAt
publishedAt

STATUS ENUMS

Create strongly typed backend enums/constants for:

CampaignStatus
PlatformPostStatus
AutomationStatus
PublishAttemptStatus

Keep them aligned conceptually with the mobile application's state model.

DO NOT create multiple conflicting definitions.

DATABASE CONSTRAINTS

Add appropriate:

- primary keys
- foreign keys
- unique constraints
- indexes
- not-null constraints

Think about queries needed for:

get campaign
get user's campaigns
get campaign platform posts
get failed publishing attempts
get pending jobs
get automation history

Do not over-index.

SOFT DELETE

Do not add soft delete everywhere by default.

Only use it where there is a real product requirement.

MIGRATIONS

Use Drizzle migrations.

Do not manually modify production schema without migrations.

SEED DATA

Create development seed data if useful.

Do not put fake production data into the production database.

SUPABASE

Use Supabase for:

- hosted PostgreSQL
- database management
- development visibility

Do not make the backend depend on Supabase-specific APIs unless there is a clear reason.

The application domain should primarily depend on PostgreSQL/Drizzle.

DATABASE ERROR HANDLING

Ensure repository/database errors are mapped into the centralized application error system from Phase 2A.

TEST

Run:

- migrations
- schema validation
- seed if available
- CRUD tests
- relationship tests
- constraint tests

# Fix all issues.

====================================================================================================
PHASE 2C — CLOUDINARY MEDIA PIPELINE

Implement the media storage pipeline using Cloudinary.

IMPORTANT:

Cloudinary is the media storage/CDN layer for Greed Social.

Do not store image binary data in PostgreSQL.

PostgreSQL stores media metadata and Cloudinary identifiers/URLs.

ARCHITECTURE

Mobile
↓
Backend media endpoint
↓
Cloudinary
↓
Cloudinary asset
↓
Database metadata

Create a dedicated Cloudinary integration:

src/integrations/cloudinary/

Do not call Cloudinary directly from controllers.

Create a service/adapter abstraction.

REQUIRED CAPABILITIES

Support:

- image upload
- delete asset
- retrieve asset information
- generate optimized delivery URL where appropriate

Store metadata such as:

assetId
publicId
secureUrl
resourceType
format
width
height
bytes
createdAt

MEDIA VALIDATION

Before upload validate:

- MIME type
- extension where appropriate
- file size
- maximum number of images
- supported resource type

The application currently supports up to 5 images per campaign.

Do not rely only on frontend validation.

The backend must enforce the same business rule.

SECURITY

Never expose:

CLOUDINARY_API_SECRET

to the mobile application.

Do not send Cloudinary API secrets to the Expo app.

Keep Cloudinary credentials backend-only.

UPLOAD STRATEGY

Design the service so we can later choose between:

1. backend-mediated upload
2. signed direct mobile upload

For the initial implementation, choose the simplest reliable strategy for development.

However, keep the abstraction flexible enough to move to signed direct uploads later if performance requires it.

CLOUDINARY TRANSFORMATIONS

Prepare support for:

- thumbnail generation
- optimized delivery
- appropriate image resizing
- quality optimization

Do not permanently transform/originally destroy uploaded assets.

Keep the original where product requirements justify it.

ERROR HANDLING

Handle:

- invalid credentials
- network failure
- upload failure
- unsupported media
- timeout
- Cloudinary API errors

Map these to the centralized application errors.

LOGGING

Log:

- requestId
- internal asset ID
- Cloudinary public ID where safe
- operation
- duration
- success/failure

Do NOT log Cloudinary secrets.

TEST

Implement:

- successful upload
- invalid image
- oversized image
- Cloudinary failure simulation
- metadata persistence
- delete flow

Verify that the database and Cloudinary state remain consistent.

Do not leave orphaned database records when an upload definitively fails.

# Do not claim Cloudinary integration works until it has actually been tested with a real configured development environment.

====================================================================================================
PHASE 2D — CAMPAIGN DOMAIN AND BUSINESS LOGIC

Implement the core campaign domain for Greed Social.

A campaign represents one user intention to publish content across one or more platforms.

EXAMPLE

User:

"Promote our upcoming AI workshop."

Images:
1–5 uploaded images

Platforms:
Instagram
LinkedIn
X

The backend creates:

Campaign
├── Media Assets
├── Platform Posts
│ ├── Instagram
│ ├── LinkedIn
│ └── X
└── Automation Run

BUSINESS RULES

1. Campaign must belong to a user.
2. Campaign requires at least one media asset OR valid text-only content if future product requirements permit it.
3. Current mobile flow supports 1–5 images.
4. Campaign must have at least one selected platform.
5. Platform cannot be selected twice for the same campaign.
6. Platform-specific content belongs to the campaign/platform combination.
7. A platform failure must not fail unrelated platforms.
8. Retry must operate at platform/publish-attempt level.
9. Campaign status should reflect aggregate state without hiding individual platform state.

IMPLEMENT:

CampaignService

Methods conceptually:

createCampaign()
getCampaign()
listCampaigns()
updateCampaign()
deleteCampaign() where appropriate

PlatformPostService

createPlatformPosts()
getPlatformPosts()
updatePlatformPost()
approvePlatformPost()

AutomationService

startAutomation()
getAutomationStatus()
retryPlatform()
cancelAutomation() where appropriate

VALIDATION

Use Zod for:

- request validation
- domain input validation
- platform validation
- media limits

Do not rely on TypeScript types for runtime validation.

CAMPAIGN LIFECYCLE

Draft
↓
Ready
↓
Analyzing
↓
Generating
↓
Awaiting Approval
↓
Approved
↓
Publishing
↓
Completed / Partially Completed / Failed

Ensure invalid transitions are rejected.

For example:

Completed → Generating

must not silently succeed.

STATE TRANSITIONS

Create a dedicated state-transition mechanism.

Do not scatter status changes throughout random services.

Every important transition should optionally produce an automation event.

AUDIT EVENTS

Examples:

CAMPAIGN_CREATED
MEDIA_UPLOADED
GENERATION_STARTED
GENERATION_COMPLETED
PLATFORM_APPROVED
PUBLISH_STARTED
PUBLISH_SUCCEEDED
PUBLISH_FAILED
RETRY_STARTED
AUTOMATION_COMPLETED

Store useful structured metadata.

Do not store sensitive data.

TEST

Write unit tests for:

- campaign creation
- validation
- platform uniqueness
- lifecycle transitions
- partial success
- retry eligibility
- invalid transitions

Do not implement AI yet.
Do not implement social APIs yet.
====================================================================================================
PHASE 2E — AUTOMATION ENGINE + BULLMQ

Implement the asynchronous automation architecture.

TECHNOLOGY

Redis
BullMQ

PURPOSE

Long-running operations must not block HTTP requests.

Examples:

- AI content generation
- image processing
- publishing
- retries
- scheduled publishing later

ARCHITECTURE

HTTP request
↓
Create automation run
↓
Create BullMQ job
↓
Return job/run ID
↓
Worker processes job
↓
Update database
↓
Emit automation events
↓
Mobile client polls/subscribes later

QUEUES

Create logical queues such as:

content-generation
publishing
media-processing

Do not create dozens of queues without a real need.

JOB DESIGN

Every job must contain enough information to safely process the operation.

Do not put huge image binaries into Redis jobs.

Use database IDs / Cloudinary references.

JOB IDEMPOTENCY

This is extremely important.

A job must not accidentally publish the same post twice if the worker retries.

Design idempotency around:

- campaign ID
- platform post ID
- publish attempt ID
- external platform ID where available

Never assume a worker runs exactly once.

RETRY POLICY

Configure controlled retries.

Differentiate:

Retryable:

- temporary network error
- timeout
- temporary external service failure
- rate limit where appropriate

Non-retryable:

- invalid credentials
- invalid content
- unsupported media
- permission denied
- permanent platform error

Use exponential backoff where appropriate.

DO NOT create infinite retries.

DEAD LETTER / FAILED JOB HANDLING

Failed jobs must remain inspectable.

Persist failure information in PostgreSQL.

Worker logs should include:

- job ID
- automation ID
- campaign ID
- platform where applicable
- attempt number
- duration
- error code

WORKER ERROR HANDLING

Never let one failed job crash the worker process.

Unexpected worker errors must be captured and logged.

DATABASE CONSISTENCY

Update automation status carefully.

Example:

PUBLISHING
↓
SUCCESS

or:

PUBLISHING
↓
FAILED

or:

PUBLISHING
↓
RETRYING
↓
SUCCESS

PARTIAL CAMPAIGN

If:

Instagram = SUCCESS
LinkedIn = SUCCESS
X = FAILED

campaign should become:

PARTIALLY_COMPLETED

not simply FAILED.

TESTS

Create tests for:

- successful job
- retryable failure
- non-retryable failure
- retry
- duplicate job
- partial campaign
- worker exception
- database failure

# Run Redis and the worker in development and verify the complete flow.

==================================================================================================
PHASE 2F — AI CONTENT ENGINE

Implement an AI abstraction for Greed Social.

IMPORTANT:

Do not couple the business logic directly to one AI vendor.

Create:

AIProvider

with operations conceptually such as:

analyzeMedia()
generateCampaignContent()
adaptContentForPlatform()
generateHashtags()

The provider implementation should be replaceable.

ARCHITECTURE

Automation Job
↓
AI Content Service
↓
AI Provider
↓
Structured result
↓
Validation
↓
Database
↓
Platform Preview

IMAGE UNDERSTANDING

The AI should receive:

- campaign instruction
- image references/URLs
- selected platforms

It should understand:

- visible subjects
- context
- likely campaign purpose
- tone
- useful details

PLATFORM ADAPTATION

Create platform profiles/configurations rather than hardcoding giant prompts inside controllers.

Example conceptual platform configuration:

LinkedIn:

- professional
- informative
- moderate length
- business-oriented
- limited emoji
- relevant hashtags

Instagram:

- conversational
- visually oriented
- stronger hook
- appropriate emoji
- relevant hashtags

X:

- concise
- direct
- limited hashtags

Facebook:

- conversational/informative

YouTube:

- community-oriented

Do not assume these rules are permanent.
Keep them configurable.

STRUCTURED OUTPUT

The AI must return structured JSON matching a schema.

Conceptual:

{
platform,
caption,
hashtags,
suggestedMediaIds,
reasoningSummary
}

Validate AI output using Zod.

Never blindly trust model output.

If output is malformed:

- attempt controlled recovery if appropriate
- otherwise mark generation as failed
- do not store invalid content as successful

AI ERRORS

Handle:

- timeout
- rate limit
- invalid response
- provider failure
- malformed JSON
- content policy rejection

Map them into application errors.

AI LOGGING

Do not log full private prompts or user media unnecessarily.

Log:

- provider
- operation
- request ID
- campaign ID
- duration
- success/failure
- model identifier where appropriate

Do not log API keys.

TESTING

Create mocked AI provider tests.

Do not make unit tests depend on live AI calls.

Create:
MockAIProvider
RealAIProvider

The application should be able to run automated tests without an AI API key.

==================================================================================================
PHASE 2G — END-TO-END BACKEND AUTOMATION TEST

Now validate the complete backend flow.

DO NOT add new features.

Use the current implementation.

TEST SCENARIO

Create a test user.

Create a campaign:

Instruction:
"Promote our upcoming AI automation event."

Use 3 test images.

Select:

- Instagram
- LinkedIn
- X

Flow:

1. Create campaign.
2. Upload images to Cloudinary.
3. Persist media metadata.
4. Create campaign/platform records.
5. Start automation.
6. Queue AI generation.
7. Worker processes generation.
8. Mock AI analyzes media.
9. Generate platform-specific content.
10. Persist generated content.
11. Approve platforms.
12. Queue publishing.
13. Mock publishing adapters process each platform.
14. Make Instagram succeed.
15. Make LinkedIn succeed.
16. Make X fail with a retryable error.
17. Verify campaign becomes PARTIALLY_COMPLETED.
18. Retry X.
19. Make X succeed.
20. Verify campaign becomes COMPLETED.

VERIFY DATABASE

Check:

- campaign
- media assets
- platform posts
- automation run
- automation events
- publish attempts

VERIFY LOGGING

Every major operation must be traceable through:
requestId
automationId
campaignId
jobId

VERIFY RETRY

Confirm the retry does not duplicate successful Instagram or LinkedIn publishing.

VERIFY ERROR HANDLING

Simulate:

- Cloudinary failure
- database failure
- AI malformed response
- Redis/worker failure
- platform failure

Ensure errors are:

- logged
- classified
- persisted where appropriate
- safely returned
- retryable only when appropriate

RUN:

TypeScript
Lint
Unit tests
Integration tests
Worker tests
End-to-end tests

If anything fails:

1. Inspect logs.
2. Identify root cause.
3. Fix the implementation.
4. Re-run the failing test.
5. Re-run the complete flow.

Do not stop after identifying an error.

Only finish when the complete flow passes or a genuine external dependency prevents completion.

Report:

- tests executed
- failures found
- fixes made
- final result
- remaining external dependencies

=========================================

Phase 2 final architecture
EXPO APP
│
▼
Node.js API
│
┌────────────┼────────────┐
│ │ │
▼ ▼ ▼
PostgreSQL Cloudinary Redis
│ │
│ BullMQ
│ │
│ ▼
│ Worker
│ │
└────────────┬────────────┘
│
▼
AI Content Engine
│
▼
Automation Engine
│
┌──────┼──────┐
▼ ▼ ▼
Future Future Future
IG LI X
