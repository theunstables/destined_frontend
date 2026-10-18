# Tales of Two frontend

Expo and React Native frontend for LoveOS, a private shared space for exactly two paired people.

The active Java/Spring backend is the sibling project [destined_backend-main](../destined_backend-main/README.md). This frontend can run either against that API or entirely through local mock providers.

## Runtime modes

The provider mode is selected at build/startup from `EXPO_PUBLIC_API_URL`:

- **Mock mode:** leave `EXPO_PUBLIC_API_URL` empty. Typed in-memory providers and sample content support local UI development without a server.
- **API mode:** set `EXPO_PUBLIC_API_URL`. Supported services automatically use their HTTP providers, server state hydrates the app, and sample content is suppressed.

Restart Expo after changing environment variables. Expo replaces `EXPO_PUBLIC_*` values at bundle time.

Mock mode is a preview environment, not a persistence guarantee. API mode is the only mode intended to represent shared, durable couple data.

## Requirements

| Tool | Version |
|---|---|
| Node.js | 20 LTS or newer |
| npm | 10 or newer; use the committed lockfile |
| Expo SDK | 57 |
| Backend for API mode | Java 21 LoveOS API plus PostgreSQL |

Android Studio is required only for local Android builds. Xcode and macOS are required for local iOS builds. The web target provides the fastest UI development loop.

## Getting started

1. Install the exact dependency tree with `npm ci`.
2. Copy `.env.example` to `.env`.
3. Choose a runtime mode:
   - clear `EXPO_PUBLIC_API_URL` for mock mode;
   - set it to the API origin for API mode.
4. Start the target with `npm run web`, `npm run android`, or `npm run ios`.

Typical API URLs:

| Client | Development API URL |
|---|---|
| Web or iOS simulator | `http://localhost:4000` |
| Android emulator | `http://10.0.2.2:4000` |
| Physical device | `http://<development-computer-LAN-IP>:4000` |

A physical device cannot use the computer's `localhost`.

## Environment

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | API base URL without a trailing slash. Empty selects mock mode. |
| `EXPO_PUBLIC_WS_URL` | Optional WebSocket endpoint. When empty in API mode, Chat derives `/ws` from the API URL. |

These values are public and ship in the client bundle. Never store credentials, signing keys, or administrative tokens in frontend environment variables.

## Integration status

The following domains have matching typed mock and HTTP providers:

- Authentication and account recovery
- Profile, pairing, shared-space settings, pause/reactivate, and unpair lifecycle
- Relationship story and onboarding
- Home dashboard
- Calendar and occasions
- Memories, favorites, search, reciprocal notes, tags, albums, and On This Day
- Media upload
- Chat, reactions, pins, receipts, search, and realtime updates
- Timeline
- Daily Question
- Repair Signal
- Notification preferences and device registration
- Account export and deletion lifecycle
- Couple Plans workspace and deterministic trip planner
- Memory video and voice attachments
- User privacy and chat-behaviour preferences
- Watch Together realtime presence, playback, reactions, and whispers
- Expiring Shared Places locations on web

The following remain externally gated or incomplete:

- Native Shared Places capture, because `expo-location` could not be installed while the package registry was unavailable; API and browser capture are complete
- OAuth/account linking
- Push delivery and deep-link infrastructure
- AI-generated prompts; trip planning currently uses a deterministic backend generator

Capability boundaries are explicit in `src/config/capabilities.ts`; local previews must not present themselves as shared API state.

## Authentication storage

The HTTP token layer uses a storage-adapter boundary. The committed default is memory-only, so API-mode users are signed out on a cold start. A production native build must initialize that boundary with platform keychain storage, such as Expo SecureStore. Refresh tokens must never be placed in AsyncStorage or browser local storage.

Mock-mode screen state may use browser local storage to support previews. That storage is disabled in API mode.

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Start Expo and select a target |
| `npm run web` | Start the web development target |
| `npm run android` | Build and run Android |
| `npm run ios` | Build and run iOS on macOS |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run Jest once under each theme |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run lint` | Run Expo ESLint |
| `npm run build:web` | Export the production web bundle |
| `npm run predeploy` | Export web and prepare static-host fallback files |
| `npm run deploy` | Publish `dist` through `gh-pages` |

Before release, all four verification commands must pass:

1. `npm run typecheck`
2. `npm test`
3. `npm run lint`
4. `npm run build:web`

If dependencies are incomplete, report the checks as blocked rather than passed.

## Project structure

```text
src/
  app/              Expo Router routes and route guards
  modules/          Feature screens and components
  design-system/    Themes, tokens, primitives, and shared patterns
  services/         Typed provider boundaries, mocks, HTTP adapters, transport
  state/            Zustand application state and hydration
  config/           Environment and capability selection
  copy/             User-facing strings
```

Screens consume service contracts rather than importing mocks or HTTP transports directly. Durable server state is hydrated into the feature stores after authentication and couple recovery.

## Release readiness

Production release still requires:

- successful frontend typecheck, Jest, lint, and web export;
- two-account, two-device testing against the real API;
- camera, library, microphone, notification, and deep-link testing on iOS and Android;
- screen-reader, large-text, reduced-motion, keyboard, theme, and small-screen review;
- production PostgreSQL, SMTP, object storage, TLS, CORS, WebSocket, monitoring, backup, and secret configuration;
- secure native token storage initialization.

See [docs/build-status.md](docs/build-status.md) for the implementation matrix, [TECH.md](TECH.md) for architecture, and [copilot-markdowns/DEPLOYMENT_RUNBOOK.md](copilot-markdowns/DEPLOYMENT_RUNBOOK.md) for deployment steps.
