PHASE 1A — EXPO / REACT NATIVE FOUNDATION

Build the production-ready mobile foundation for Greed Social.

TECH STACK

Use:

- Expo
- React Native
- TypeScript
- Expo Router
- NativeWind

First inspect the existing repository and determine whether an Expo project already exists.

If the project already exists:

- preserve useful existing work
- refactor only where necessary

If it does not exist:

- initialize the Expo project using the current stable Expo-compatible approach
- configure TypeScript
- configure Expo Router
- configure NativeWind correctly for the installed Expo/React Native versions

DO NOT introduce unnecessary libraries.

FOUNDATION REQUIREMENTS

Create a clean structure similar to:

app/
\_layout.tsx
index.tsx
create/
campaign/
settings/

src/
components/
features/
hooks/
services/
types/
constants/
utils/
theme/
store/

Keep route files thin.

Separate UI from business logic.

Create reusable primitives where appropriate:

- Button
- IconButton
- Card
- TextInput
- Screen
- Modal
- LoadingView
- EmptyState
- ErrorState
- StatusBadge

Create centralized constants for:

- platform identifiers
- automation statuses
- error categories
- supported media types
- maximum image count
- application configuration

Create TypeScript types for the future domain:

Platform:

- instagram
- facebook
- linkedin
- x
- youtube
- whatsapp

AutomationStatus:

- idle
- selecting
- uploading
- analyzing
- generating
- awaiting_approval
- publishing
- success
- warning
- failed
- retrying

These should be reusable throughout the project.

MEDIA LIMITS

The first product flow supports:

- minimum: 1 image
- maximum: 5 images

Do not hardcode "5" in multiple components.
Create a central constant.

MEDIA VALIDATION

Support common image formats appropriate for mobile upload.

Validate:

- file type
- file existence
- basic size constraints
- maximum image count

Errors should be represented using reusable application-level error objects rather than arbitrary strings.

NOTIFICATIONS

Prepare a centralized notification abstraction.

For example:

notifySuccess(...)
notifyWarning(...)
notifyError(...)
notifyInfo(...)

For now these can use a suitable mobile notification/toast implementation.

Do not scatter Alert.alert calls throughout the application.

NAVIGATION

Create the basic navigation structure:

Home
Create Campaign
Campaign Preview
Settings

The actual screens can initially contain realistic placeholder states.

DO NOT implement backend calls.

DO NOT implement social integrations.

DO NOT implement AI.

At the end:

- run TypeScript checks
- run linting if available
- start Expo and verify there are no runtime errors
- fix all issues
- summarize the files created/changed

====================================================================================================

PHASE 1B — PRODUCTION IMAGE HANDLING

Implement the complete mobile image-selection experience for Greed Social.

GOAL

The user must be able to:

1. Open Create Campaign.
2. Tap Add Images.
3. Choose images from the device gallery.
4. Select multiple images.
5. Add up to 5 images.
6. See thumbnails immediately.
7. Reorder images.
8. Remove images.
9. Replace an image.
10. Continue only when at least one valid image exists.

Use Expo-compatible media/image libraries appropriate for the current project.

Before adding dependencies, inspect package.json and use existing dependencies where possible.

IMAGE PICKING

Support multi-selection if the selected Expo/image-picker implementation allows it reliably.

Handle:

- permission denied
- permission cancelled
- picker cancelled
- invalid media
- too many images
- unexpected picker errors

Do not crash the application.

IMAGE STATE

Create a dedicated media model.

Example conceptual structure:

MediaAsset:

- id
- uri
- type
- filename
- width
- height
- size
- order
- localStatus

Do not tightly couple this model to Expo's picker response.

Create an adapter that converts Expo picker results into our internal MediaAsset type.

UI

Build a polished image grid.

Example:

[ + Add ] [ image ] [ image ]
[ image ] [ image ] [ image ]

Each image should support:

- remove
- preview
- reorder

The first image should visually indicate that it is the primary image.

Allow the user to change the primary image by reordering.

EMPTY STATE

When no images exist:

Show:
"Add up to 5 images"

and a clear CTA.

LIMIT STATE

When 5 images are selected:

Disable the add action and clearly communicate:

"Maximum 5 images"

DO NOT implement uploads to a server yet.

The architecture must make it easy to later replace local URI handling with remote object-storage URLs.

ERROR HANDLING

All image-related errors should flow through the centralized error/notification abstraction created in Phase 1A.

Do not duplicate notification logic.

TEST

Manually/test:

- one image
- five images
- six attempted images
- cancellation
- permission denial
- removing an image
- reordering
- replacing an image
- navigating away and back

Fix all TypeScript/runtime issues before finishing.

====================================================================================================
PHASE 1C — COMPLETE GREED SOCIAL MOBILE UI

Implement the complete mobile user interface for Greed Social.

IMPORTANT:
This is a real product UI, not a wireframe.

The entire client-side flow should be navigable using mocked/local data.

DO NOT connect a backend yet.

PRIMARY FLOW

Home
↓
Create Campaign
↓
Add Images
↓
Campaign Instruction
↓
Select Platforms
↓
Generate
↓
Generating/Processing
↓
Campaign Preview
↓
Edit Platform Content
↓
Approve
↓
Publishing Simulation
↓
Result Dashboard

HOME SCREEN

Create a strong primary CTA:

"Create Campaign"

Secondary areas can show:

- recent campaigns
- drafts
- recent automation status

Keep the home screen uncluttered.

CREATE CAMPAIGN

The screen should contain:

1. Media section
2. Campaign instruction
3. Platform selection
4. Continue/Generate CTA

CAMPAIGN INSTRUCTION

Example:

"What do you want to post?"

Placeholder:

"Example: Announce our new AI workshop and encourage people to register."

Allow multi-line text.

Validate that the instruction is not empty.

PLATFORM SELECTION

Display platform cards for:

Instagram
Facebook
LinkedIn
X
YouTube

WhatsApp can be represented in the architecture but should clearly communicate if a capability is not currently supported.

Each platform card should have:

- icon
- name
- selected state
- supported/coming-soon state if applicable

Do not use platform brand colors excessively.

At least one platform must be selected.

CAMPAIGN GENERATION

When the user presses Generate:

Use mocked data.

Transition:

idle
→ analyzing
→ generating
→ awaiting_approval

Show a polished processing screen.

Use realistic status messages:

"Analyzing your images..."
"Understanding your campaign..."
"Adapting content for each platform..."
"Preparing your previews..."

Do not use fake delays everywhere. If a delay is required for UX simulation, isolate it inside mock services so it can later be removed.

CAMPAIGN PREVIEW

Create tabs/cards for:

LinkedIn
Instagram
Facebook
X
YouTube

Each platform should display:

- selected image(s)
- generated caption
- hashtags
- platform status
- edit button
- approve button

Example LinkedIn:

Caption:
"We're excited to announce our upcoming AI automation workshop..."

Hashtags:
#AI #Automation #Technology

Example Instagram:

Caption:
"Okay, we're building something pretty cool..."

Hashtags:
#AI #Automation #Tech

The examples are mock data only.

EDITING

The user must be able to edit:

- caption
- hashtags
- selected media

Do not mutate global campaign state unpredictably.

Use controlled state and clear update functions.

APPROVAL

Allow:

- approve individual platform
- approve all

Display clear state:

Awaiting approval
Approved
Publishing
Published
Failed

PUBLISHING

For Phase 1, publishing is simulated.

Do not connect real social APIs.

Show realistic per-platform processing.

Example:

LinkedIn
✓ Published

Instagram
✓ Published

X
⚠ Needs attention

Facebook
✕ Failed

The purpose is to establish the exact UI/state model the real backend will later populate.

RESULT SCREEN

Show:

- campaign name
- platforms
- final statuses
- timestamp
- retry button for failed items
- view campaign button

RECENT CAMPAIGNS

Create realistic campaign cards.

Each card:

- thumbnail
- campaign name
- platform icons
- status
- date

DESIGN

Use:

- NativeWind
- consistent spacing
- typography hierarchy
- cards
- subtle borders
- polished empty/loading/error states

Avoid excessive gradients, excessive animations and unnecessary decorative elements.

The application should feel professional enough to eventually become a Play Store application.

RESPONSIVENESS

Test on:

- small Android screen
- standard Android screen
- large Android screen

Avoid:

- fixed widths
- text overflow
- clipped buttons
- keyboard overlap
- content hidden behind safe areas

IMPORTANT

Do not implement backend logic.

Use a dedicated mock service layer:

src/services/mock/

This must return typed domain objects that resemble what the future backend will return.

At the end:

- test the entire flow from Home → Result
- run TypeScript/lint/build checks
- fix all issues
- # report any remaining limitations

====================================================================================================
PHASE 1D — CAMPAIGN STATE MACHINE AND AUTOMATION STATUS SYSTEM

Refactor the client-side campaign flow into a predictable state-driven architecture.

Do not scatter boolean flags such as:

isLoading
isGenerating
isPublishing
hasError
isDone

across unrelated components.

Use a centralized campaign/automation state model.

DEFINE STATES

Campaign lifecycle:

DRAFT
MEDIA_SELECTED
READY_TO_GENERATE
ANALYZING
GENERATING
AWAITING_APPROVAL
PARTIALLY_APPROVED
APPROVED
PUBLISHING
COMPLETED
PARTIALLY_COMPLETED
FAILED

Platform-level lifecycle:

IDLE
PROCESSING
AWAITING_APPROVAL
APPROVED
PUBLISHING
SUCCESS
WARNING
FAILED
RETRYING

The backend will eventually control these states, so keep the model API-friendly.

PLATFORM RESULT MODEL

Conceptually:

PlatformPost:

- id
- campaignId
- platform
- media
- caption
- hashtags
- status
- error
- warning
- publishedAt
- externalPostId

Create strongly typed interfaces.

ERROR MODEL

Create a reusable application error representation.

Example categories:

NETWORK
VALIDATION
AUTHENTICATION
AUTHORIZATION
MEDIA
AI
PLATFORM
RATE_LIMIT
TIMEOUT
SERVER
UNKNOWN

Each error should support:

- code
- category
- userMessage
- technicalMessage
- retryable

Do not expose technical error details directly to users.

STATUS UI

Every platform should be independently trackable.

Example:

Instagram → SUCCESS
LinkedIn → PUBLISHING
X → FAILED
Facebook → WARNING

The UI should not assume that all platforms succeed or fail together.

RETRY

Implement a mocked retry flow for a failed platform.

Example:

X FAILED
↓
Retry
↓
RETRYING
↓
SUCCESS

Keep retry logic inside a service/state layer, not inside the screen component.

IMPORTANT

This architecture must be reusable when the real backend is introduced.

After implementation:

- test every transition
- test partial success
- test complete failure
- test retry
- test approval
- test cancellation
- # test navigation during processing

====================================================================================================
PHASE 1E — NOTIFICATION AND USER FEEDBACK SYSTEM

Implement a centralized notification and feedback system for Greed Social.

The user must always understand what the application is doing.

SUPPORT:

SUCCESS
WARNING
ERROR
INFO
PROCESSING

Examples:

SUCCESS:
"Campaign generated successfully."

WARNING:
"Instagram is ready, but YouTube requires additional setup."

ERROR:
"Instagram publishing failed. You can retry."

INFO:
"3 platforms selected."

PROCESSING:
"Preparing your campaign..."

Create reusable notification APIs.

Do not call platform-specific notification libraries directly from screens.

Create a centralized abstraction.

Also implement screen-level states:

Loading
Empty
Error
Success
Processing

For long-running operations:

- show progress
- show current operation
- show platform where relevant

Example:

"Publishing 2 of 4 platforms"

Instagram ✓
LinkedIn ✓
X → Publishing...
Facebook → Waiting

Do not block the entire UI unnecessarily.

If a platform succeeds while another fails, preserve the successful state.

Do not reset the whole campaign because one platform fails.

Handle:

- network loss
- app backgrounding where practical
- navigation during processing
- retry
- cancellation

# Keep the implementation ready for backend-driven realtime/status updates later.

====================================================================================================
PHASE 1F — BACKEND-READY CLIENT SERVICE ARCHITECTURE

Prepare the Expo application for integration with the future Node.js backend.

DO NOT build the backend.

Create a clean API client/service abstraction.

The UI must NEVER directly call fetch/axios/network APIs.

Instead use:

UI
↓
Feature hook
↓
Service
↓
API client
↓
Backend

Create a centralized API client with:

- base URL configuration
- request timeout
- headers
- JSON parsing
- standardized errors
- request IDs where appropriate
- environment configuration

Create typed service interfaces for future operations:

campaignService
mediaService
automationService
platformService

Conceptual methods:

campaignService.createCampaign()
campaignService.getCampaign()
campaignService.updateCampaign()

mediaService.uploadMedia()

automationService.generateContent()
automationService.approvePlatform()
automationService.publishCampaign()
automationService.retryPlatform()

platformService.getConnectedPlatforms()

For Phase 1, these methods may use mock implementations.

IMPORTANT:
Do not mix mock implementation with UI code.

Use an abstraction so that later:

MockCampaignService
↓
RealCampaignService

can be swapped without rewriting screens.

CONFIGURATION

Prepare environment-based configuration for:

API_BASE_URL
APP_ENV

Do not commit secrets.

Do not hardcode production URLs.

REQUEST LOGGING

Prepare a centralized request logging abstraction.

Development logs can include:

- method
- endpoint
- request ID
- duration
- status

Never log:

- passwords
- access tokens
- refresh tokens
- private user content unnecessarily
- sensitive credentials

The frontend should be able to correlate a failed request with a request ID.

At the end:

- verify that all screens use services instead of direct network calls
- verify TypeScript
- verify lint
- verify Expo runtime
- remove dead code
- # document the architecture briefly

====================================================================================================
PHASE 1 FINAL QA — DO NOT ADD NEW FEATURES

Perform a complete production-readiness audit of the current Greed Social Expo mobile application.

Do not add new product features.

Inspect the entire codebase.

CHECK:

1. TypeScript errors
2. ESLint errors/warnings
3. Expo configuration
4. Expo Router navigation
5. NativeWind configuration
6. Android safe areas
7. Keyboard handling
8. Image picker permissions
9. Image selection
10. Five-image limit
11. Image removal
12. Image reordering
13. Campaign creation
14. Platform selection
15. Mock generation flow
16. Platform preview
17. Editing
18. Approval
19. Publishing simulation
20. Partial failure
21. Retry
22. Notifications
23. Loading states
24. Empty states
25. Error states
26. State transitions
27. Service abstraction
28. API client abstraction
29. Environment configuration
30. Sensitive information accidentally logged
31. Hardcoded URLs
32. Hardcoded secrets
33. duplicated logic
34. oversized components
35. unnecessary dependencies
36. accessibility
37. Android layout issues
38. small-screen layout
39. large-screen layout

Run the application and test the complete user journey:

Home
→ Create Campaign
→ Select 1 image
→ Select 5 images
→ Try 6 images
→ Enter campaign instruction
→ Select platforms
→ Generate
→ Preview
→ Edit
→ Approve
→ Simulate publishing
→ Produce partial failure
→ Retry failed platform
→ Complete campaign

Fix all bugs discovered.

IMPORTANT:
Do not claim the application is ready unless you actually run the available checks.

At the end provide:

- files changed
- bugs found
- bugs fixed
- remaining limitations
- exact command(s) used for validation
- # whether Phase 1 is ready for backend integration
