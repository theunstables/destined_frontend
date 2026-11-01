# UI, Plans, and Chat Changes - 2026-11-01

## Status

Implemented locally in the active frontend and backend. No commit, push, deployment, or production data migration was performed. Backend packaging and focused tests passed. Frontend runtime verification remains blocked by missing React/Jest/Expo packages and HTTP 503 responses from npm; this is not a full UI sign-off.

## Shared Component Fixes

### Scroll Motion Follow-Up

Added [ScrollReveal](../src/design-system/patterns/ScrollReveal.tsx), using the existing Reanimated dependency rather than adding the browser-only AOS package. Web uses IntersectionObserver; native uses the measured AppScreenLayout scroll viewport. Reveals run once per mounted item, with short, capped staggering and existing theme timing/easing.

- Fade: Plans screen introductions and section headings, including Home's grouped sections.
- Rise: memory text cards, timeline items, and Plans hub cards.
- Zoom: next-adventure cards, album grids, memory photo tiles, and featured capsules.
- Soft flip: Bingo tiles and capsule list rows. Rotation is shallow, not a full card inversion.
- Popups: shared overlay backdrop fade and a subtle centered-content scale entrance. Bottom sheets retain their own slide animations.

Navigation, text-entry fields, Chat messages, album rails, and full-width photo pagers were intentionally left steady. Existing grid sizing is retained on reveal wrappers. The new motion honors app/system reduced-motion settings; keyboard focus and touch reveal a target immediately. Content remains visible when an observer is unavailable, and native measurement has a visible fallback for unsupported refs.

Validation: six direct geometry/fallback checks, four native observer control-flow checks with measurement stubs, and four real browser IntersectionObserver checks passed (offscreen, scroll entry, once-only, and missing-observer fallback). All six shared entrance/exit builders retain reduced-motion guards. Touched source files passed TypeScript transpilation syntax checks. Jest regressions were added for observer cleanup/failure and the existing motion invariant was updated.

The full app did not start because Expo/React/Reanimated/Jest packages are missing. Editor diagnostics also reflect the missing Expo tsconfig/types. The browser check exercised the actual compiled observer helper in an isolated page, not the complete React/Reanimated UI. Full visual, native-device, and reduced-motion interaction verification remains pending dependencies. No deployment was performed. Previously generated transfer PDFs do not include this follow-up until repackaged.

- [DateField](../src/design-system/primitives/DateField.tsx) no longer treats its own incomplete-value emission as an external reset. Backspacing `01 / 01 / 2002` preserves the untouched segments. External replacement/clearing of complete dates is synchronized.
- [Button](../src/design-system/primitives/Button.tsx) exposes its duplicate-click guard as a disabled state, clears the timer on unmount, and resets the guard when its label changes. Capsule wizard steps use separate button instances so rapid Continue presses do not inherit an earlier step's lock.
- Shared text links handle Enter on web and are underlined. Heading variants expose heading semantics.
- Sign-in, sign-up, and password recovery support Enter submission, with pending-request guards.
- Shared inputs support maximum lengths and submission callbacks. A default HTML document title is provided for web export.
- The expanded Chat attachment sheet scrolls on short viewports. Chat loading failures and map-opening failures have visible feedback.

Regression coverage was added/updated in the existing date, button, capsule, Bingo, Chat store, attachment, and browser suites. Frontend Jest cases have not run in this environment.

## Backend Image Storage

New local uploads default to `./uploads` relative to the backend process's working directory. The folder is ignored by Git. Existing local storage validation and atomic-write behavior are unchanged.

Set these on the deployed backend, particularly if it previously had `MEDIA_DRIVER=s3`:

```dotenv
MEDIA_DRIVER=local
MEDIA_LOCAL_DIR=./uploads
```

This changes where new uploads go; it does not migrate or delete existing S3 files. Keep `PUBLIC_API_URL` set to the backend URL so returned media links work.

**Free Render storage is ephemeral. Images can be lost when the service restarts, spins down, or redeploys. This is a temporary setup, not durable production storage.** Use a persistent disk on an appropriate paid service or durable object storage before relying on long-term image retention.

## Bingo Cards Planner

- Dedicated route: `/bingo`, linked from the Plans hub. `/plans/year` remains a compatibility route.
- Create, edit, remove, and cycle cards through not-started, in-progress, and done.
- Maximum 25 cards, titles up to 140 characters, notes up to 1,000 characters.
- Progress and remaining days are calculated from the board rather than fixture totals.
- Save failures are visible; Reload Saved Plans restores server state before retrying.
- The existing `/v1/plans` frontend contract now has a real couple-scoped backend implementation.

## Time Capsules

- The wizard stores actual text for letters, predictions, promises, and questions, plus a title and optional seal note.
- Photos and memory attachments are not offered as fake capsule content. This implementation is text-first; attaching actual media to capsules remains separate work.
- Sealing confirmation appears only after a successful save, using the server's receipt. Failed saves preserve the local draft and offer in-place reload/retry.
- Unlock dates are enforced by the backend using UTC. Changing the device clock or editing an existing capsule's unlock date cannot reveal its content early.
- Sealed payloads are omitted from API responses. Content is returned after a server-authorized open at or after the unlock date. This is application-level access enforcement, not end-to-end encryption.
- Existing sealed payloads survive normal redacted-document updates. Revision checks reject stale partner/device writes rather than silently overwriting them.
- Queued saves/hydration ignore responses from an earlier store generation after sign-out/reset.

## Chat Additions

- Add Note in the attachment menu opens a multiline shared-note editor, limited to 4,000 characters. These are messages visible to both partners, not private personal notes.
- Share Current Location requests a foreground browser location fix, previews coordinates, and requires a separate Send Location confirmation. Cancellation discards the pending fix and never sends it.
- Location messages contain a one-time OpenStreetMap link. There is no background tracking or continuous/live sharing. A sent location remains part of message history like other messages.
- The browser geolocation API requires HTTPS and permission. Native iOS/Android location capture is not implemented by the existing location adapter and reports unavailable; it would need native location support in a later build.
- Notes and locations use the existing optimistic-send/failure/retry pipeline. Retry IDs remain stable to prevent duplicate messages after a lost response.
- The backend validates message kinds, note content, trusted map host/scheme, and coordinate bounds. Location URLs are not treated as image attachments when saving a message as a memory.

## Deployment Order

1. Make a database backup using your existing provider process.
2. Deploy the updated `destined_backend`. Flyway applies [V11](../../destined_backend/src/main/resources/db/migration/V11__couple_plans.sql) for Plans and [V12](../../destined_backend/src/main/resources/db/migration/V12__chat_notes_and_locations.sql) for the new message kinds.
3. Configure local media variables above. Preserve the existing database, JWT, CORS, and [Resend setup](RESEND_SETUP.md).
4. On a machine with working package access, install frontend dependencies, run typecheck/Jest/web export, and resolve failures before deploying the frontend. The backend must be updated before the frontend starts sending note/location messages or saving Plans.
5. Test with two dedicated paired QA accounts. Do not use personal messages or locations during validation.

## Verification Performed

- A selected backend run passed 27 tests, including genuine embedded PostgreSQL startup/Flyway migration validation, messaging validation, local media behavior, and Plans sealing/revision cases.
- After a final Plans response-field hardening change, all 6 Plans tests passed and the backend JAR was rebuilt successfully. Unknown fields cannot overwrite client-store actions/flags.
- Five direct checks of the actual transpiled location helper passed: valid map URL, invalid latitude, invalid longitude, NaN, and missing geolocation.
- 260 source/test files in the affected frontend areas parsed with zero TypeScript syntax diagnostics. This is not semantic typechecking or a Jest run.
- Editor diagnostics reported no new errors in the checked files.
- Frontend Jest could not start (`jest` unavailable); Expo could not start (`expo` unavailable); a fresh npm probe returned HTTP 503. No local browser URL is running, and the updated UI was not exercised in Playwright. The live site still represents its previously deployed code.

## Remaining QA Gate

Run the updated frontend tests and web export, then exercise date segment editing/paste/clearing, rapid wizard transitions, keyboard navigation, card add/edit/remove/reload, partner write conflicts, capsule sealing/opening boundaries, location permission denial/cancellation/send, note failure/retry, and small-screen keyboard layouts. Verify that restarting the backend preserves Plans/Chat in PostgreSQL, while treating temporary local media according to the storage warning above.

The changes address the reported date issue and the identified shared-component problems. They do not establish that every component in the application is free of UI defects.