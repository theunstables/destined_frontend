# Redesign Decision Log

## D-001 — Entire product scope

**Date:** October 9, 2026  
**Decision:** Include all routed product modules and meaningful embedded substates, not only the canonical 33-state journey.

## D-002 — Design authority

**Date:** October 9, 2026  
**Decision:** The approved scope and finalized HTML prototypes override conflicting current Expo visuals. Existing Expo architecture remains preferred where technically sound.

## D-003 — Markdown API contracts

**Date:** October 9, 2026  
**Decision:** API contracts are authored in Markdown before backend changes. No OpenAPI deliverable is required for this redesign.

## D-004 — Reuse before extension

**Date:** October 9, 2026  
**Decision:** Compare every UI operation with `destined_backend-main` and reuse existing endpoints first. Add APIs and immutable Flyway migrations only for contract-proven gaps.

## D-005 — Main repositories

**Date:** October 9, 2026  
**Decision:** `destined_frontend-main` is the main UI repository. `destined_backend-main` is the backend implementation folder.

## D-006 — No Git operations

**Date:** October 9, 2026  
**Decision:** Do not perform Git operations in either folder during this work.

## D-007 — Mocks remain test providers

**Date:** October 9, 2026  
**Decision:** Existing mocks remain for deterministic tests and optional showcase mode. Completed configured product flows use real HTTP/WebSocket providers.

## D-008 — Unsupported settings are honest

**Date:** October 9, 2026  
**Decision:** A setting without a real local, platform, or backend operation is disabled or informational. It must not simulate successful persistence.

## D-009 — Sensitive cycle data

**Date:** October 9, 2026  
**Decision:** Period tracking is user-owned and private by default. Partner sharing is explicit, minimal, revocable, and presents estimates as non-medical information.

## D-010 — Continue without npm registry

**Date:** October 9, 2026  
**Decision:** Continue source, contract, backend, and static-analysis work without
installing packages. Do not weaken the manifest or remove required dependencies
to make an incomplete local tree appear valid. Frontend executable checks remain
mandatory blocked gates until a complete lockfile-matching dependency tree is
available.

## D-011 — Embedded canonical states remain explicit deliverables

**Date:** October 9, 2026  
**Decision:** A07, A08, A09, P06, P10, and P12 do not require artificial routes
when an in-place state preserves context better. They retain canonical IDs,
individual acceptance criteria, and tests in the implementation matrix.

## D-012 — Approved A03 password policy

**Date:** October 9, 2026  
**Decision:** A03's approved live rules are the product contract: 8–128
characters, one number, and one non-whitespace special character. The frontend
schema and Spring request validation follow the approved UI rather than editing
the design to preserve the earlier backend-only letter requirement. Login does
not apply creation rules, preserving access for existing accounts.

## D-013 — Public auth transport isolation

**Date:** October 9, 2026  
**Decision:** Public authentication operations use an explicit unauthenticated
transport path. They never hydrate, attach, or refresh a prior bearer token.
This prevents logout from rotating the refresh token it is attempting to revoke
and keeps account recovery independent from stale device credentials.

## D-014 — Separate API and application link origins

**Date:** October 9, 2026  
**Decision:** `PUBLIC_API_URL` identifies the backend. `PUBLIC_APP_URL` identifies
the web origin or `talesoftwo://` custom scheme used by password-reset email.
Reset tokens must open the frontend reset screen, not an undefined backend page.

## D-015 — Final global visual direction

**Date:** October 11, 2026  
**Decision:** `ziyu_frontend/docs/design/destined-two-worlds-title-reveal-final.html`
is the final global brand and theme authority. Its two-worlds-to-one-world
concept, light/dark palette, typography mood, and reveal treatment override
older global visual styling. Feature prototypes continue to own screen layout,
content hierarchy, and interactions where this brand prototype is silent.

## D-016 — Product display name

**Date:** October 11, 2026  
**Decision:** The redesigned product display name is `Destined`, matching the
final title-reveal design. Existing package IDs, URL scheme, and purchased
domain remain unchanged until release migration is planned; changing visible
brand copy does not silently invalidate installed deep links or application
identity.

## D-017 — Pair Later is a deliberate confirmation screen

**Date:** October 11, 2026  
**Decision:** P12 now has `/(onboarding)/pair-later`. This narrowly supersedes
D-011 for P12 because the final approved pairing design gives it a complete
screen with its own explanation, assurance card, solo continuation, and return
to invitation. P06 and P10 remain contextual embedded states so entered codes
and connection context are preserved.
