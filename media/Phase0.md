Core idea:

A user selects 1–5 images, describes what they want to communicate, selects social platforms, and the system prepares platform-specific content. The user reviews/edits it and eventually publishes it through the appropriate integration.

The eventual production flow is:

User
↓
Select 1–5 images
↓
Describe intent
↓
Select platforms
↓
AI understands campaign/images
↓
Generate platform-specific content
↓
Preview / edit
↓
Approve
↓
Automation engine
↓
Publish
↓
Track each platform independently
↓
Success / warning / error / retry

For Phase 1, do not implement the backend or real social publishing yet.

We want to finish the mobile application as a polished, testable client with mocked/local data where necessary.

You are working on a production-grade mobile application called "Greed Social".

IMPORTANT:
This is NOT a webinar/demo-only project.
This is the foundation of a real consumer application that will eventually be published to the Google Play Store.

PRODUCT VISION

Greed Social is an AI-powered social media content and publishing automation application.

The user should eventually be able to:

1. Select/upload 1–5 images.
2. Describe what they want to communicate.
3. Select one or more social platforms.
4. Have AI understand the uploaded media and user intent.
5. Generate platform-specific captions, hashtags, formatting and content.
6. Preview the generated content separately for every platform.
7. Edit generated content manually.
8. Approve individual platforms or the complete campaign.
9. Publish through the appropriate platform integration.
10. Track the status of every automation independently.
11. Retry failed operations safely.
12. Receive clear processing, success, warning and error states.
13. Eventually schedule posts.
14. Eventually support multiple social platforms.

Potential platforms include:

- Instagram
- Facebook
- LinkedIn
- X/Twitter
- YouTube
- WhatsApp-related workflows where technically and officially supported

Do NOT assume that every platform supports identical publishing capabilities.
The backend will later use platform-specific adapters and official APIs wherever appropriate.

CURRENT DEVELOPMENT PHASE

We are currently implementing PHASE 1 ONLY:

MOBILE APPLICATION FOUNDATION + UI + COMPLETE CLIENT-SIDE FLOW

Do NOT build:

- backend
- PostgreSQL
- Redis
- BullMQ
- social API integrations
- OAuth integrations
- Playwright automation
- AI API calls
- real publishing
- production authentication

Instead, build the mobile application architecture so these can be connected cleanly later.

TECHNOLOGY

Use:

- Expo
- React Native
- TypeScript
- NativeWind
- Expo Router
- modern React patterns
- functional components
- hooks
- reusable components
- strict TypeScript

The application must be Android-first but should remain structurally compatible with iOS.

ENGINEERING PRINCIPLES

1. Production-oriented architecture.
2. Strong separation of concerns.
3. Reusable components.
4. No giant components.
5. No duplicated business logic.
6. No hardcoded platform-specific logic scattered throughout UI.
7. Strong TypeScript types.
8. Centralized constants.
9. Centralized status enums.
10. Centralized error representation.
11. Centralized notification/toast handling.
12. Accessibility where practical.
13. Responsive layouts for different Android screen sizes.
14. Avoid unnecessary dependencies.
15. Avoid overengineering.
16. Keep code understandable for developers joining the project later.
17. Do not create placeholder architecture that will obviously need to be rewritten later.

DESIGN DIRECTION

The app should feel like a real modern SaaS/mobile product.

Do NOT make it look like:

- a tutorial app
- a default Expo template
- a generic AI chatbot
- a developer dashboard

The UX should be:

- clean
- modern
- fast
- minimal
- intuitive
- visually polished
- content-focused

The primary interaction should be extremely obvious:

SELECT MEDIA → DESCRIBE → SELECT PLATFORMS → GENERATE → REVIEW → APPROVE

IMPORTANT IMPLEMENTATION RULE

Before modifying files:

1. Inspect the repository.
2. Identify the existing project structure.
3. Reuse good existing code where appropriate.
4. Do not blindly overwrite existing files.
5. Explain what you intend to change.
6. Then implement.

After implementation:

1. Run TypeScript checks.
2. Run linting if configured.
3. Run the Expo application/build checks available in the environment.
4. Fix all errors caused by your changes.
5. Do not claim success without actually validating it.

Do not proceed into later phases unless explicitly instructed.
