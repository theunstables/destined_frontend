# Frontend build and integration status

Last updated: 2026-10-18

This document describes what the frontend actually does in mock and API modes. Backend contracts and verification evidence are authoritative in [the backend API reference](../../destined_backend-main/docs/API.md), [feature register](../../destined_backend-main/docs/FEATURES.md), and [progress tracker](../../destined_backend-main/docs/PROGRESS.md).

## Status definitions

- **Integrated:** frontend mock and HTTP providers exist and the backend contract is implemented.
- **Verification:** implementation exists, but one or more package, physical-device, product, safety, or infrastructure gates remain.
- **Preview only:** local UI/sample behavior exists, but API mode disables it because no durable backend contract exists.
- **External gate:** source boundaries exist, but provider credentials or infrastructure are required.

Code existence is not production verification.

## Provider selection

`src/config/env.ts` selects the application mode once at module load:

- Empty `EXPO_PUBLIC_API_URL` selects mock providers and sample content.
- A configured `EXPO_PUBLIC_API_URL` selects HTTP providers and suppresses sample content.
- `EXPO_PUBLIC_WS_URL` is optional; Chat derives the WebSocket URL from the API URL when it is empty.

Feature screens consume typed service contracts. Their index modules choose the implementation, so screens do not import provider-specific code.

Unsupported functionality is represented by the typed registry in `src/config/capabilities.ts`. API mode fails closed rather than presenting local-only mutations as shared or durable.

## Integrated domain matrix

| Domain | Frontend boundary | Backend route | Status | Notes |
|---|---|---|---|---|
| Authentication | `services/auth` | `/v1/auth/*` | Integrated | Signup, login, refresh, logout, verification, password reset, current user |
| Profile and pairing | `services/pairing` | `/v1/pairing/*` | Verification | Profile, invite lifecycle, confirmation, shared space, pause/reactivate, unpair grace; physical two-client recovery test remains |
| Relationship story | `services/story` | `/v1/story` | Integrated | Whole-story hydration and replacement, moments, date precision, key dates |
| Media | `services/media` | `/v1/media` | Verification | Authenticated multipart upload; local or S3 backend; physical picker/upload tests remain |
| Memories | `services/memories` | `/v1/memories/*` | Integrated | CRUD, favorite, search, tags, albums, On This Day, reciprocal notes |
| Calendar | `services/calendar` | `/v1/calendar/*` | Integrated | Event CRUD, annual recurrence, merged upcoming occasions |
| Home | `services/home` | `/v1/home` | Integrated | Composite read model over couple, Story, Calendar, and Memories |
| Chat | `services/chat` | `/v1/chat/*` and `/ws` | Verification | Durable HTTP writes, idempotent retry, reactions, pins, receipts, search, realtime notifications; physical two-device test remains |
| Account lifecycle | `services/account` | `/v1/account/*` | Verification | Export, deletion grace/cancellation, account lifecycle; device gate remains |
| Notifications | `services/notifications` | `/v1/notifications/*` | Verification | Preferences, quiet hours, timezone, device registration; push delivery is externally gated |
| Timeline | `services/timeline` | `/v1/timeline` | Verification | Read-only Story/Calendar/Memories projection |
| Daily Question | `services/dailyQuestions` | `/v1/daily-question/*` | Verification | Daily assignment, reciprocal reveal, exactly-one Memory conversion; visual/device gates remain |
| Repair Signal | `services/repairSignal` | `/v1/repair-signal/*` | Verification | Quiet expiring signal, mutual readiness, sender cancellation; safety/visual/device gates remain |
| Plans | `services/plans` | `/v1/plans` | Integrated | Couple-scoped JSON workspace; sealed letter bodies remain server-masked |
| Trip planner | `services/planner` | `/v1/planner/*` | Integrated | Deterministic destination catalogue and itinerary generation; no external AI dependency |
| User preferences | `services/preferences` | `/v1/preferences` | Integrated | User-scoped privacy and chat-behaviour settings |
| Shared Places | `services/sharedPlaces` | `/v1/plans/places/*` | Verification | Current fix only, server expiry, immediate pause deletion; web capture works, native package install remains blocked |
| Watch Together | `services/watchTogether` | `/ws`, `/v1/plans` | Verification | Couple-scoped presence/playback relay plus persisted room, queue, whispers, completion history, and Memory keepsake; physical two-device drift test remains |
| Deep links | `app/+native-intent.tsx` | — | Source complete | Allow-listed auth, pairing, account, Home, Chat, Calendar, Timeline, Memories, Plans, Watch, Shared Places, occasion, letter, and capsule routes; native-device verification remains |
| Adaptive prompts | `services/adaptiveContent` | `/v1/content/suggestions` | Integrated | Deterministic couple/day-specific rotation from a curated catalogue; no external AI or couple-data transfer |

All authenticated shared-data routes derive user and couple scope from the verified access token. Client-supplied ownership identifiers are not trusted.

## Preview-only and externally gated domains

| Capability | Current frontend behavior | Why it is not live in API mode |
|---|---|---|
| OAuth/account linking | Controls are unavailable | Provider credentials and account-linking policy are missing |
| Push delivery | Preference and device-registration state exists | Expo/FCM/APNs credentials are missing; deep-link routing itself is implemented separately |
| Provider-generated prompts | Curated deterministic prompts are live without a provider | External generation remains disabled pending privacy, retention, moderation, model, and cost policy |
| Native location capture | API and browser geolocation are implemented | `expo-location` installation failed with registry HTTP 503; native builds fail closed instead of using sample coordinates |
| End-to-end encryption | Not implemented | Requires separate product and security architecture |

These features must remain disabled or explicitly labelled unavailable in API mode until their contracts exist.

## Persistence and security boundaries

### Server state

API-backed shared content persists in PostgreSQL through the Spring backend. Frontend stores hydrate from the API and are not the authority.

### Mock state

Selected mock-mode stores can use `localStorage` through `createMockPersistStorage`. That adapter is explicitly disabled in API mode and must not be treated as production persistence.

### Credentials

Access and refresh tokens use `services/storage` through a storage-adapter boundary. The committed adapter is memory-only. Consequently, an API-mode cold start loses the refresh token and signs the user out.

A production native build must initialize this boundary with encrypted platform keychain storage. AsyncStorage and browser local storage are not acceptable refresh-token stores.

## Media status

Expo Image Picker is wrapped behind `services/media` and reports cancellation, permission refusal, unavailable platform APIs, unsupported types, and oversized selections as typed errors.

Picker-side validation rejects reported files over 25 MB and MIME types unsupported by the backend. The backend remains authoritative: it enforces request size and verifies file signatures rather than trusting client metadata.

Remaining media verification:

- Real iOS and Android library/camera behavior
- Real files at, below, and above the 25 MB boundary
- Offline, timeout, retry, and interrupted upload behavior
- Microphone and voice-recorder permission/failure behavior
- S3 production object-storage configuration and orphan cleanup policy

## Accessibility and visual status

Implemented source safeguards include:

- light and dark theme test projects;
- shared design tokens for color, type, spacing, and motion;
- system and in-app reduced-motion handling for shared entering/exiting animations;
- labelled controls, alerts/live regions, busy/disabled states, and modal focus boundaries in shared flows;
- duplicate-action guards for network-backed actions.

Source review does not replace physical accessibility QA. Screen-reader, keyboard, large-text, high-contrast, small-screen, theme, and reduced-motion passes remain release gates.

## Automated quality status

The repository declares these required checks:

1. `npm run typecheck`
2. `npm test`
3. `npm run lint`
4. `npm run build:web`

Jest runs the same suites as separate `lavender` and `midnight` projects.

### Current workstation limitation

The local dependency installation is interrupted. Direct TypeScript execution reaches the compiler but stops before application checking because `@types/jest` and `expo/tsconfig.base` are missing. Jest, Expo, and ESLint command shims are also unavailable.

Therefore, no current full-suite, lint, typecheck, or production-export success is claimed. Workspace diagnostics report no errors across the complete `src` tree, and both standalone scripts in `scripts` pass Node syntax validation. These source-level checks do not replace the dependency-backed gates.

When registry access is restored and the no-install constraint is explicitly lifted:

1. Run `npm ci`.
2. Run all four required checks.
3. Fix any application failures.
4. Inspect and smoke-test the generated `dist` bundle.

## Backend verification status

According to the backend progress tracker dated 2026-10-18:

- The complete 168-test Maven suite passes with no failures, errors, or skipped tests.
- Flyway V1–V13 is verified from an empty PostgreSQL 16.2 schema through version V13 before Hibernate validation.
- The deployable Spring Boot JAR packages with all 13 migrations and excludes embedded-PostgreSQL test dependencies.
- Couple lifecycle, Messaging/Realtime, Daily Question, Repair Signal, reciprocal Memory notes, Plans, Watch, calls, and provider-independent V13 features retain their documented manual, safety, native-device, or external-provider gates.
- Product completion remains in progress because OAuth, push delivery, paid billing, real media transport, and generated/AI behavior require external decisions, credentials, or infrastructure.

Consult the backend tracker rather than copying test totals here; totals and phase evidence change as backend work advances.

## Release gates still open

### Frontend tooling

- Restore dependencies with `npm ci`.
- Pass typecheck, both-theme Jest projects, lint, and production web export.
- Verify the production bundle contains the correct API and WebSocket origins.

### Two-device behavior

- Pair two real accounts and recover the connection after application/backend restart.
- Verify Chat send, retry, receipts, typing, reactions, pins, reconnect, and HTTP catch-up without duplicates.
- Verify Daily Question reciprocity and exactly-one Memory creation.
- Verify Repair Signal cancellation, expiry, and symmetric mutual readiness.
- Verify pause/reactivate, unpair grace/cancellation, account export, and deletion lifecycle.

### Platform QA

- Test iOS, Android, and web permissions and deep links.
- Complete screen-reader, keyboard, large-text, reduced-motion, small-screen, and dark/light theme reviews.
- Test media failures and boundary files.
- Confirm secure native token storage is initialized before production authentication testing.

### Infrastructure

- Configure production PostgreSQL with TLS, backups, and monitored connection limits.
- Configure SMTP and verified sender identity.
- Configure S3-compatible object storage and public delivery URLs.
- Configure exact CORS origins, HTTPS, WebSocket routing, and secrets.
- Configure `/health` liveness and `/health/ready` readiness probes.
- Configure push credentials before enabling delivery.
- Complete staging smoke tests before production deployment.

## Documentation map

- [Frontend README](../README.md): setup, modes, scripts, and contributor orientation
- [Frontend architecture](../TECH.md): design and service architecture
- [Deployment runbook](../copilot-markdowns/DEPLOYMENT_RUNBOOK.md): environment and release procedure
- [Readiness summary](../copilot-markdowns/AUTONOMOUS_READINESS_STATUS.md): latest autonomous implementation work and blockers
- [Backend API reference](../../destined_backend-main/docs/API.md): HTTP contracts
- [Backend feature register](../../destined_backend-main/docs/FEATURES.md): backend/frontend capability inventory
- [Backend progress tracker](../../destined_backend-main/docs/PROGRESS.md): test evidence and remaining phase gates
