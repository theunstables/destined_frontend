# Destined UI Redesign

**Started:** October 9, 2026  
**UI repository:** `destined_frontend-main`  
**API implementation:** `destined_backend-main`  
**Status:** In progress — Wave 2 authentication

## Objective

Build every product screen and meaningful substate in the Expo application, implement its validation and UI operations, define the required API contract in Markdown, and then reuse or extend the Spring Boot API. A screen is not complete merely because it renders.

## Design authority

The global visual foundation is
`ziyu_frontend/docs/design/destined-two-worlds-title-reveal-final.html`. Its
two-worlds-to-one-world concept, light/dark palette, typography mood, and title
reveal define the final brand direction. Screen-specific references below own
layout and interaction details where the title-reveal prototype has no screen
equivalent.

When sources disagree, use this order:

1. `ziyu_frontend/docs/design/destined-two-worlds-title-reveal-final.html` — final global brand and theme direction.
2. `ziyu_frontend/docs/design/DESTINED_FIGMA_SCOPE.md` — canonical A/P/O state inventory and acceptance criteria.
3. `ziyu_frontend/docs/design/UXMAGIC_SCREEN_PROMPTS.md` — detailed content requirements.
4. `ziyu_frontend/docs/design/destined-auth-pairing-onboarding-final.html` — approved auth/pairing/onboarding layout and interactions.
5. `ziyu_frontend/docs/design/destined-home-two-worlds-final.html` — approved Home layout, hierarchy, and interactions.
6. Existing Expo implementation — retain architecture and behavior where it does not conflict with an approved source.

Figma authoring and `.fig` export are outside this implementation.

## Delivery rule

Each feature is delivered as a vertical slice:

1. Screen and substate inventory.
2. Light and dark UI.
3. Accessibility and responsive behavior.
4. Client validation and UI operations.
5. Frontend service types and adapters.
6. Markdown API contract.
7. Existing-backend comparison.
8. Backend extension where required.
9. Frontend, backend, and integrated tests.
10. Completion evidence in the implementation matrix.

## Definition of done

A screen or substate is complete only when all applicable checks pass:

- Stable ID, route, owner, entry, exit, and guard are documented.
- Approved light and dark designs are implemented.
- 320 px narrow mobile, 390 × 844 target, Android, and web-column layouts work.
- Keyboard, screen reader, safe-area, contrast, focus, and reduced-motion requirements work.
- Initial, loading, empty, populated, validating, disabled, error, offline/retry, success, confirmation, and destructive states are handled where applicable.
- Validation and normalization rules have automated tests.
- Operations protect against duplicate submission and stale responses.
- Server-backed operations have a Markdown contract and typed frontend boundary.
- The backend endpoint is reused or implemented with authorization and validation tests.
- Integrated happy and recovery paths pass.
- Evidence is linked from `IMPLEMENTATION_MATRIX.md`.

## Documentation index

- [Screen inventory](SCREEN_INVENTORY.md)
- [Implementation matrix](IMPLEMENTATION_MATRIX.md)
- [API coverage matrix](API_COVERAGE_MATRIX.md)
- [Validation and quality gates](VALIDATION_MATRIX.md)
- [Decision log](DECISION_LOG.md)
- `contracts/` — feature contracts written before backend changes
- `evidence/` — baseline and iteration test evidence

## Delivery waves

| Wave | Scope | Status |
|---|---|---|
| 0 | Baseline, inventory, matrices, dependency recovery | Complete except blocked dependency recovery |
| 1 | Design system, navigation, HTTP/session foundation | In progress — final palette, display type, and native reveal implemented |
| 2 | Authentication A01–A09 | In progress — A01–A09 implemented in source; executable and device verification blocked |
| 3 | Pairing P01–P12 and onboarding O01–O12 | In progress — P01–P12 and O01–O12 implemented in source; executable and device verification blocked |
| 4 | Home, Calendar, Daily Question, Repair Signal, Song, Cycle | In progress — Daily Question, Repair Signal, Calendar, and occasions implemented in source; unsupported Song/Cycle operations remain contract-gated |
| 5 | Memories, Albums, Media, Timeline | In progress — reciprocal notes, provider-backed album read/create/membership flows, mock-gated unsupported media, and provider-backed timeline are implemented in source |
| 6 | Chat and realtime moments | In progress — durable HTTP/WebSocket chat exists; paired identities are hydrated and unsupported call controls are disabled |
| 7 | Plans and shared-future features | Blocked — local previews remain mock-only and all Plans routes are gated from API-backed builds |
| 8 | Profile, Settings, Account, Privacy, Notifications | In progress — profile/shared-space/lifecycle operations, notification sync, deletion lifecycle, and account export delivery are implemented; unsupported operations are informational |
| 9 | Complete two-user flows and release hardening | Not started |

## Current environment constraint

The npm registry is unavailable. The local `node_modules` folders are interrupted
npm staging trees: many package directories exist but contain no package
manifest or executable content. No new package is required for the current
source work, so implementation continues with the existing dependency manifest.

Frontend typecheck, lint, Jest, and Expo export remain mandatory gates, but are
recorded as blocked rather than reported as passing until an intact local
dependency tree or registry access is available. Static editor diagnostics and
source-level tests are still added during this period.

## Required verification commands

Frontend:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --runInBand`
- `npm run build:web`

Backend:

- `mvn test`
- `mvn package`

No Git operations are part of this work.
