# Autonomous readiness status

## Completed in source

- Added provider-error, busy-state, and duplicate-action coverage for Daily Question and Repair Signal.
- Added Daily Question and Repair Signal HTTP error-mapping coverage.
- Connected shared entering/exiting animations to both the operating-system reduced-motion preference and the app's own Reduce Motion setting.
- Added picker-side 25 MB and MIME-type validation using metadata already supplied by Expo Image Picker.
- Added explicit user copy for oversized and unsupported photo/video selections.
- Replaced the Windows-only static-host preparation command with a cross-platform Node script.
- Added a typed capability registry for provider and device boundaries.
- Added API-backed Plans, planner, preferences, memory video/voice fields, Watch Together realtime, and expiring Shared Places locations.

## Backend-backed domains

Authentication, pairing, story/onboarding, home, calendar, memories, albums, chat, notifications, timeline, daily questions, repair signals, profile details, account lifecycle, Plans, planner, user preferences, and Shared Places have HTTP providers. Watch Together uses the authenticated WebSocket.

## Intentionally unavailable in API mode

- Native location capture until `expo-location` can be installed
- External OAuth and push delivery until provider credentials/infrastructure are supplied
- AI-generated prompts until privacy, retention, moderation, and cost policies exist

These are capabilities, not hidden local fallbacks. API mode must not imply that local sample mutations are shared or durable.

## Verification status

Editor diagnostics are clean. All 151 backend tests pass against PostgreSQL/Flyway V1–V12, and the deployable JAR contains the new migration and runtime classes. Frontend executable verification remains blocked by an interrupted dependency tree: the local install has no executable TypeScript/Jest/Expo/ESLint shims. Installing `expo-location` also failed with registry HTTP 503.

Do not report Jest, lint, typecheck, or Expo export as passing until dependencies can be restored with `npm ci` and the commands run successfully.

## Manual release checks still required

- Two physical accounts on separate devices for pairing, chat, reciprocity gates, unpair grace period, and account deletion.
- Screen-reader pass on iOS, Android, and web.
- Small-screen and large-text layout pass.
- Slow/offline upload behavior with real 25 MB boundary files.
- Dark/light theme visual review.
- Production SMTP, object storage, database, CORS, TLS, and WebSocket configuration.
