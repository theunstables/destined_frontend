# Profile and pairing API contract

**Status:** Implemented in source; frontend execution blocked by unavailable dependencies  
**Screens:** P01–P12  
**Base URL:** `{PUBLIC_API_URL}/v1`

## Preconditions

All operations require a bearer session with a verified email. The server derives
the user and couple from the authenticated principal; callers never supply their
own user or couple ID.

## Operations

| State | Method | Path | Request | Success |
|---|---|---|---|---|
| P02 | `GET` | `/pairing/profile` | — | `Profile` |
| P02 | `PUT` | `/pairing/profile` | `Profile` | replaced `Profile` |
| P03/P04 | `POST` | `/pairing/invites` | — | `201 Invite` |
| P04 | `POST` | `/pairing/invites/cancel` | `{ "code" }` | `204` |
| P05/P07 | `POST` | `/pairing/redeem` | `{ "code" }` | `Partner` |
| P08/P09 | `POST` | `/pairing/confirm` | `{ "partnerId" }` | `Partner` |
| Bootstrap | `GET` | `/pairing/space` | — | `SpaceStatus` |
| Settings | `GET` | `/pairing/lifecycle` | — | `CoupleLifecycle` |
| Settings | `POST` | `/pairing/lifecycle/pause` | — | `CoupleLifecycle` |
| Settings | `POST` | `/pairing/lifecycle/reactivate` | — | `CoupleLifecycle` |
| Settings | `POST` | `/pairing/lifecycle/unpair` | — | `CoupleLifecycle` |
| Settings | `POST` | `/pairing/lifecycle/unpair/cancel` | — | `CoupleLifecycle` |

A local profile photo is uploaded through the media service before `PUT
/pairing/profile`; the pairing endpoint receives only a remote HTTP(S) URL.

## State machine

- `none`: P01/P02; no active invite or reserved partner.
- `inviting`: P04; the caller owns one active invitation.
- `pending`: P07/P08/P09; an invitation is reserved but not committed.
- `connected`: P11 and subsequent onboarding/product flow.
- `paused`: shared writes are blocked while history remains readable.
- `archived`: unpair grace period completed; retained history is read-only.

Cold-start routing uses `/pairing/space` as authority. `inviting` resumes at P04,
`pending` resumes at P08, `connected`/`paused`/`archived` enter the product, and
`none` resumes at P01. During an active flow, P11 remains visible after a
successful confirmation before continuing to story onboarding.

## Invitation rules

- Codes are six unambiguous uppercase characters and expire after 24 hours.
- Display separators are presentation only; the backend normalizes input.
- Creating an invite invalidates a previous live invite from the same user.
- Redeem previews/reserves a partner; confirm is the commit boundary.
- Confirm validates `partnerId` against the caller's own reserved invitation.

## Stable errors

| Code | UI behavior |
|---|---|
| `CODE_INVALID` | P06 inline invalid-code state; preserve input for correction. |
| `CODE_EXPIRED` | P06 expired state; ask the partner for a new code. |
| `CANNOT_PAIR_WITH_SELF` | P06 self-pairing state without exposing internals. |
| `ALREADY_PAIRED` | Explain that this account already belongs to a relationship and recover via bootstrap. |
| `EMAIL_NOT_VERIFIED` | Return to A04. |
| `NETWORK` | Preserve state and offer retry. |
| unknown | Generic recoverable error. |

## Route and access rules

- Unauthenticated users return to A01.
- Signed-in but unverified users return to A04.
- Verified, unpaired users cannot deep-link into the product group.
- Root/cold-start routing resumes from server `SpaceStatus`, not a default local
  onboarding screen.
- P06 and P10 remain explicit embedded acceptance states so the current code and
  connection context survive recovery. P12 is a deliberate confirmation route
  because it owns both solo continuation and return-to-invitation operations.

## Open items

- Production photo selection and permission handling remain dependent on the
  existing media-picker package being executable.
- `phone` and `phoneVerified` exist in frontend settings types but are not part
  of the pairing backend profile contract; they must not be sent until a
  dedicated account-security contract is approved.
- Frontend Jest/theme execution remains blocked until a complete dependency tree
  is available.
