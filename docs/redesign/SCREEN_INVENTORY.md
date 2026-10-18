# Screen and Substate Inventory

**Status:** Initial inventory; routes and implicit substates are being reconciled with implementation.  
**State IDs:** Canonical A/P/O IDs are fixed. Additional prefixes are defined below.

## State prefixes

| Prefix | Area |
|---|---|
| A | Authentication |
| P | Profile setup and pairing |
| O | Onboarding / Our Story |
| H | Home |
| C | Calendar and occasions |
| DQ | Daily Question |
| RS | Repair Signal |
| M | Memories and albums |
| T | Timeline |
| CH | Chat and realtime moments |
| PL | Plans |
| PR | Profile and settings |
| AC | Account, privacy, and notifications |

## Required substate suffixes

Every screen is checked for applicable variants: `.initial`, `.loading`, `.empty`, `.populated`, `.focused`, `.validating`, `.invalid`, `.request-error`, `.offline`, `.retrying`, `.success`, `.confirm`, `.disabled`, `.expired`, `.permission-denied`, and `.reduced-motion`.

## Authentication

| ID | Screen | Current route | Required explicit states |
|---|---|---|---|
| A01 | Welcome | `/(auth)/welcome` | Initial, reduced motion, offline informational |
| A02 | Sign In | `/(auth)/sign-in` | Initial, focused, invalid, loading, credentials error, offline, social unavailable |
| A03 | Create Account | `/(auth)/sign-up` | Initial, password rules, invalid, duplicate email, loading, offline |
| A04 | Verify Email | `/(auth)/verify-email` | Waiting, verifying, resend cooldown, resent, invalid token, expired token, offline |
| A05 | Forgot Password | `/(auth)/forgot-password` | Initial, invalid, submitting, offline |
| A06 | Reset Password | `/(auth)/reset-password` | Initial, strength states, mismatch, submitting, invalid/expired token |
| A07 | Reset Link Sent | Auth flow state | Anti-enumeration success, resend cooldown |
| A08 | Password Updated | Auth flow state | Success and return-to-sign-in |
| A09 | Sign In Error | Sign-in state | Preserved email, credentials error, retry/recovery |

## Profile setup and pairing

| ID | Screen | Current route | Required explicit states |
|---|---|---|---|
| P01 | Relationship Setup | `/(onboarding)/setup` | Three explicit connection choices |
| P02 | Create Profile | `/(onboarding)/profile` | Empty, validating, media permission, upload, upload failure, saved |
| P03 | Invite Partner | `/(onboarding)/invite` | Creating, active code, copy/share success/error, offline |
| P04 | Invitation Sent | `/(onboarding)/invitation-sent` | Waiting, redeemed, expired, cancel confirmation/error |
| P05 | Enter Partner Code | `/(onboarding)/enter-code` | Initial, partial, complete, finding, paste, offline |
| P06 | Invalid Code | Code-entry state | Invalid, expired, already used, retry |
| P07 | Partner Found | `/(onboarding)/partner-found` | Loaded, reject confirmation, stale reservation |
| P08 | Confirm Partner | `/(onboarding)/confirm-partner` | Ready, confirming, privacy acknowledgement |
| P09 | Connecting | `/(onboarding)/connecting` | Progress and timeout |
| P10 | Connection Error | Connecting state | Retryable, conflict, already paired, offline |
| P11 | Relationship Connected | `/(onboarding)/connected` | Success and continue |
| P12 | Pair Later | `/(onboarding)/pair-later` plus Profile entry | Confirmation, solo continuation, resume pairing |

## Onboarding

| ID | Screen | Current route | Required explicit states |
|---|---|---|---|
| O01 | Our Story Begins | `/(onboarding)/story-begins` | Initial, start, skip confirmation |
| O02 | Story Cover | `/(onboarding)/story-cover` | Initial and skip |
| O03 | When We Met | `/(onboarding)/when-we-met` | Precision variants, invalid future date, saved, skipped |
| O04 | First Date | `/(onboarding)/first-date` | Empty, media permission/upload/error, invalid date, saved |
| O05 | Became Us | `/(onboarding)/became-us` | Empty, validation, saved, skipped |
| O06 | First Memory | `/(onboarding)/first-memory` | Empty, media permission/upload/error, saved |
| O07 | Days That Matter | `/(onboarding)/days-that-matter` | Empty/partial, edit rows, validation, saved |
| O08 | Story Recap | `/(onboarding)/story-recap` | Complete/partial, edit return, saving, save error |
| O09 | Story Ready | `/(onboarding)/story-ready` | Success and continue |
| O10 | Personalize Space | `/(onboarding)/personalize` | Dawn/Dusk/Night, validation, saving/error |
| O11 | Ready to Come Home | `/(onboarding)/ready-to-come-home` | Preview and finalizing |
| O12 | Welcome Home | `/(onboarding)/welcome-home` | Celebration, reduced motion, route transition |

## Product routes

### Home, calendar, and connection

| ID | Route/surface | Notes |
|---|---|---|
| H01 | `/(app)/home` | Approved nine-section dashboard; each widget gets independent loading/empty/error state |
| H02 | `/(app)/compatibility` | Couple facts, positive compatibility, unavailable/partial profile |
| C01 | `/(app)/calendar` | Month grid, selected date, event list, loading/empty/error |
| C02 | `/(app)/occasions/[key]` | Occasion detail and missing/deleted event |
| DQ01 | Home/detail surface | Unanswered, waiting, partner-answered-hidden, complete, edit, error |
| RS01 | Home/detail surface | None, open-sent, open-received, mutual, cancel confirm, expired |

### Memories and timeline

| ID range | Existing routes/scope |
|---|---|
| M01–M09 | Memories home, new, detail, edit, search, favorites, On This Day, albums, album detail |
| M10 | Reciprocal private-note states: none, mine-only waiting, revealed, edited, withdrawn; a distinct partner-hidden indicator is unavailable in the current response contract |
| T01 | `/(app)/timeline` — loading, populated typed feed, cursor paging, empty, initial error/retry, older-page error, and supported detail drill-downs |

### Chat

| ID | Existing route/scope |
|---|---|
| CH01 | `/chat` — Chat Home |
| CH02 | `/chat/conversation` — loading, empty, thread, typing, reply, reaction, attachments, failed/retry, offline |
| CH03 | `/chat/search` — pinned, search idle/results/empty/error |
| CH04 | `/chat/moment/voice` — permission, recording, preview, upload, send/error |
| CH05 | `/chat/moment/video` — permission, recording/select, preview, upload, send/error |

### Plans

| ID range | Existing routes/scope |
|---|---|
| PL01 | `/plans` hub |
| PL02–PL05 | Trip setup, generating, itinerary, alternate preview decision |
| PL06 | Year Together |
| PL07 | Lifetime |
| PL08–PL09 | Capsules vault and creation wizard |
| PL10–PL12 | Letters list, compose, read |
| PL13 | Watch Together |
| PL14 | Shared Places |

### Profile and settings

| ID range | Existing routes/scope |
|---|---|
| PR01 | Profile/Settings home |
| PR02 | Personal details |
| PR03 | Partner and relationship lifecycle |
| PR04 | Our Space |
| PR05 | Dates |
| PR06 | Appearance |
| PR07 | Accessibility |
| PR08 | Language |
| PR09 | Home layout |
| PR10 | Memories settings |
| PR11 | Chat settings |
| PR12 | Security |
| PR13 | Phone verification |
| AC01 | Notifications and quiet hours |
| AC02 | Privacy |
| AC03 | Data/export |
| AC04 | Delete account and grace period |
| AC05 | Billing |
| AC06 | Help |
| AC07 | Feedback |
| AC08 | About |
| AC09–AC11 | Terms, Privacy Policy, Licenses |

## Inventory completion rule

Before a delivery wave starts, every route above must be expanded into matrix rows for each user-visible substate. A visual state embedded in one route still counts as a separate acceptance target even when it does not need a separate Expo route.
