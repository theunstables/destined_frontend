# Implementation Matrix

## Status legend

- ✅ Complete and evidenced
- 🟡 Existing but requires redesign, integration, or missing-state work
- 🔴 Missing
- ⚪ Not started
- N/A Not applicable

A row becomes ✅ only after UI, operations, contract classification, tests, themes, accessibility, and evidence are complete.

## Canonical journey

| ID | UI | States/validation | Frontend service | Markdown contract | Backend | Tests | A11y/themes | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A01 Welcome | ✅ native two-worlds reveal | ✅ replay + reduced motion | N/A | ✅ `AUTH.md` | N/A | 🟡 source tests; execution blocked | ✅ light/dark + semantic reveal | 🟡 blocked verification |
| A02 Sign In | ✅ source | ✅ field/request states | 🟡 mock + HTTP public mode | ✅ `AUTH.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ floating shell + light/dark semantics | 🟡 blocked verification |
| A03 Create Account | ✅ source | ✅ local + server field errors | 🟡 mock + HTTP public mode | ✅ `AUTH.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ requirements card + responsive shell | 🟡 blocked verification |
| A04 Verify Email | ✅ source | ✅ server-authoritative API mode | 🟡 mock + HTTP | 🟡 `AUTH.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ raised illustration + narrative hierarchy | 🟡 blocked verification |
| A05 Forgot Password | ✅ source | ✅ validation + privacy assurance | 🟡 mock | 🟡 `AUTH.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ non-enumerating privacy card | 🟡 blocked verification |
| A06 Reset Password | ✅ source | ✅ password policy + confirmation | 🟡 mock + HTTP public mode | ✅ `AUTH.md` | ✅ app deep link | 🟡 source tests; execution blocked | ✅ card-backed strength meter | 🟡 blocked verification |
| A07 Reset Link Sent | ✅ embedded source | ✅ secure sent state + resend | 🟡 mock | 🟡 `AUTH.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ assurance card + live announcement | 🟡 blocked verification |
| A08 Password Updated | ✅ embedded source | ✅ success + return-to-sign-in | 🟡 mock + HTTP | 🟡 `AUTH.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ success hierarchy + polite announcement | 🟡 blocked verification |
| A09 Sign In Error | ✅ embedded source | ✅ inline error, status card, email preserved | 🟡 mock + HTTP | 🟡 `AUTH.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ field state + accessible alert | 🟡 blocked verification |
| P01 Relationship Setup | ✅ source | ✅ three explicit paths | 🟡 mock + HTTP configured mode | ✅ `PAIRING.md` | N/A | 🟡 source tests; execution blocked | ✅ accessible Floating Glass choices | 🟡 blocked verification |
| P02 Create Profile | ✅ source | ✅ form, media, field/request errors | 🟡 mock + HTTP configured mode | ✅ `PAIRING.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ narrative shell + error surface | 🟡 blocked verification |
| P03 Invite Partner | ✅ source | ✅ creating, share, copy, errors | 🟡 mock + HTTP configured mode | ✅ `PAIRING.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ secure code surface | 🟡 blocked verification |
| P04 Invitation Sent | ✅ source | ✅ waiting, feedback, cancel confirmation | 🟡 mock + HTTP configured mode | ✅ `PAIRING.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ waiting code surface | 🟡 blocked verification |
| P05 Enter Partner Code | ✅ source | ✅ partial, complete, finding, paste | 🟡 mock + HTTP configured mode | ✅ `PAIRING.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ segmented entry + narrative shell | 🟡 blocked verification |
| P06 Invalid Code | ✅ embedded source | ✅ specific errors, preserved code, retry | 🟡 mock + HTTP configured mode | ✅ `PAIRING.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ accessible error card | 🟡 blocked verification |
| P07 Partner Found | ✅ source | ✅ loaded, reject, stale guard | 🟡 mock + HTTP configured mode | ✅ `PAIRING.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ partner reveal card | 🟡 blocked verification |
| P08 Confirm Partner | ✅ source | ✅ confirmation and cancel | 🟡 mock + HTTP configured mode | ✅ `PAIRING.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ paired-person card | 🟡 blocked verification |
| P09 Connecting | ✅ source | ✅ progress and safe late-response guard | 🟡 mock + HTTP configured mode | ✅ `PAIRING.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ announced progress hierarchy | 🟡 blocked verification |
| P10 Connection Error | ✅ embedded source | ✅ retry and return-to-code | 🟡 mock + HTTP configured mode | ✅ `PAIRING.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ error medallion + alert card | 🟡 blocked verification |
| P11 Relationship Connected | ✅ source | ✅ success and continue | 🟡 mock + HTTP configured mode | ✅ `PAIRING.md` | ✅ existing | 🟡 source tests; execution blocked | ✅ shared-world reveal surface | 🟡 blocked verification |
| P12 Pair Later | ✅ source route | ✅ solo continuation + invite return | 🟡 mock + HTTP configured mode | ✅ `PAIRING.md` | ✅ lifecycle | 🟡 source tests; execution blocked | ✅ profile assurance state | 🟡 blocked verification |
| O01 Our Story Begins | ✅ source | ✅ begin + skip | 🟡 mock | ⚪ | ✅ existing | 🟡 source tests; execution blocked | ✅ shared-world hero + step 1 | 🟡 blocked verification |
| O02 Story Cover | ✅ source | ✅ begin + skip | 🟡 mock | ⚪ | N/A | 🟡 source tests; execution blocked | ✅ shared-world cover + step 2 | 🟡 blocked verification |
| O03 When We Met | ✅ source | ✅ precision-aware validation | 🟡 mock | ⚪ | ✅ existing | 🟡 source tests; execution blocked | ✅ narrative shell + step 3 | 🟡 blocked verification |
| O04 First Date | ✅ source | ✅ optional capture + media states | 🟡 mock | ⚪ | ✅ story/media | 🟡 source tests; execution blocked | ✅ responsive capture + step 4 | 🟡 blocked verification |
| O05 Became Us | ✅ source | ✅ optional moment capture | 🟡 mock | ⚪ | ✅ existing | 🟡 source tests; execution blocked | ✅ narrative shell + step 5 | 🟡 blocked verification |
| O06 First Memory | ✅ source | ✅ optional capture + media states | 🟡 mock | ⚪ | ✅ story/media | 🟡 source tests; execution blocked | ✅ responsive capture + step 6 | 🟡 blocked verification |
| O07 Days That Matter | ✅ source | ✅ five optional local dates | 🟡 mock | ⚪ | ✅ existing | 🟡 source tests; execution blocked | ✅ approved copy + step 7 | 🟡 blocked verification |
| O08 Story Recap | ✅ source | ✅ empty, populated, saving, error | 🟡 mock | ⚪ | ✅ existing | 🟡 source tests; execution blocked | ✅ timeline cards + accessible error | 🟡 blocked verification |
| O09 Story Ready | ✅ source | ✅ added/skipped checklist | 🟡 mock | ⚪ | N/A | 🟡 source tests; execution blocked | ✅ honest completion states | 🟡 blocked verification |
| O10 Personalize Space | ✅ source | ✅ required name + style selection | 🟡 mock | ⚪ | ✅ existing | 🟡 source tests; execution blocked | ✅ three named visual previews | 🟡 blocked verification |
| O11 Ready to Come Home | ✅ source | ✅ continue | 🟡 mock | ⚪ | ✅ home | 🟡 source tests; execution blocked | ✅ data-backed shared-world hero | 🟡 blocked verification |
| O12 Welcome Home | ✅ source | ✅ replace into Home | 🟡 mock | ⚪ | N/A | 🟡 source tests; execution blocked | ✅ final shared-world threshold | 🟡 blocked verification |

## Product areas

| Area | UI coverage | Real provider | Backend coverage | Primary gap | Overall |
|---|---:|---:|---:|---|---:|
| Home | ✅ implemented widgets in source | ✅ mock + HTTP | ✅ aggregate + feature APIs | Unsupported widgets and executable verification | 🟡 |
| Calendar/occasions | ✅ source | ✅ mock + HTTP | ✅ | Executable dual-theme/device verification | 🟡 |
| Daily Question | ✅ Home surface source | ✅ mock + HTTP | ✅ | Executable dual-theme/device verification | 🟡 |
| Repair Signal | ✅ Home state-machine source | ✅ mock + HTTP | ✅ | Executable dual-theme/device verification | 🟡 |
| Memories/albums | ✅ source | ✅ mock + HTTP | ✅ | Executable dual-theme/device verification | 🟡 |
| Timeline | ✅ source | ✅ mock + HTTP | ✅ | Executable dual-theme/device verification | 🟡 |
| Chat/realtime | 🟡 source | ✅ mock + HTTP/WebSocket | ✅ | Executable two-client/device verification; voice/video moments remain honest shells | 🟡 |
| Plans | 🟡 mock preview, API-gated | 🔴 | 🔴 | Entire backend domain and persistence | 🔴 |
| Profile/settings | ✅ supported source | ✅ mock + HTTP where supported | 🟡 | Missing APIs remain explicitly unavailable | 🟡 |
| Notifications | ✅ settings source | ✅ mock + HTTP preferences | 🟡 | Device registration/delivery external and executable verification | 🟡 |
| Account/export/deletion | ✅ source | ✅ mock + HTTP lifecycle | ✅ | Executable dual-theme/device verification | 🟡 |
| Song | 🟡 Home prototype | 🔴 | 🔴 | Product contract and backend ownership | 🔴 |
| Period tracking | 🟡 Home prototype | 🔴 | 🔴 | Privacy contract, schema, API, settings | 🔴 |

## Current iteration

| Work item | Status | Evidence |
|---|---:|---|
| Redesign documentation index | ✅ | `docs/redesign/README.md` |
| Initial route/state inventory | ✅ | `docs/redesign/SCREEN_INVENTORY.md` |
| Initial implementation matrix | ✅ | This file |
| API coverage baseline | ✅ | `docs/redesign/API_COVERAGE_MATRIX.md` |
| Authentication contract draft | ✅ | `docs/redesign/contracts/AUTH.md` |
| Accessible auth request errors | 🟡 | Shared `AuthFormError`; executable tests blocked by dependencies |
| A04 resend and verification authority | 🟡 | Session email resend and `/auth/me` confirmation implemented; executable tests blocked by dependencies |
| A04 missing-session safety | 🟡 | Empty resend payload is blocked locally with an accessible recovery error; executable tests blocked |
| A04 already-verified recovery | 🟡 | Resend conflict is treated as completed verification and advances safely; source test added, execution blocked |
| A03 password contract parity | 🟡 | Approved number + special-character policy aligned across UI contract, frontend schema, and backend validation; frontend execution blocked |
| HTTP authentication adapter tests | 🟡 | Source coverage includes all auth operations, error mapping, token/session cleanup, fail-safe logout, and public-vs-authenticated transport; execution blocked |
| Password-reset email deep link | ✅ | `PUBLIC_APP_URL` routes web/custom-scheme links to `/reset-password`; focused backend tests passed |
| Public auth transport isolation | 🟡 | Auth operations cannot attach/refresh stale bearer credentials; source tests added, execution blocked |
| Local API environment example | ✅ | Spring Boot default aligned to port 4000 in `.env.example` |
| Pairing contract and HTTP parity | 🟡 | Profile read/save, invite/redeem/confirm/cancel, space, lifecycle, media sequencing, error mapping, and source tests implemented; execution blocked |
| P01–P12 pairing redesign | 🟡 | Floating Glass choices, secure code cards, explicit P06/P10 recovery, partner cards, connected state, and P12 confirmation route implemented with source assertions; executable and device verification blocked |
| O01–O12 story onboarding redesign | 🟡 | Native shared-world heroes, seven-step accessible progress, approved narrative hierarchy, recap/error states, named visual cover cards, and completion-path source assertions implemented; executable and device verification blocked |
| Home Daily Question states | 🟡 | Provider-backed unanswered, waiting, partner-hidden, complete reciprocal reveal, validation/error copy, and source tests implemented; executable verification blocked |
| Home Repair Signal states | 🟡 | Provider-backed idle, sent, received, mutual, error, and confirmed cancellation states with source tests implemented; executable verification blocked |
| Calendar and occasion redesign | 🟡 | Approved calendar card treatment, provider-backed Home/month/agenda projections, occasion details, loading/error recovery, and source tests implemented; executable verification blocked |
| Home aggregate integration | 🟡 | Hydrated `/v1/home` greeting, days, stats, upcoming dates, recent memories, and pulse now drive the dashboard; samples are restricted to mock-mode previews; HTTP/source tests added and execution blocked |
| M10 reciprocal private notes | 🟡 | Memory detail now covers empty, mine-only waiting, reciprocal reveal, edit, withdrawal, revealed-pair confirmation, provider errors, and source tests; executable verification blocked |
| T01 relationship timeline | 🟡 | Home entry, protected route, provider-backed feed, cursor paging, empty/error/retry states, typed cards, drill-downs, and HTTP/screen source tests implemented; executable verification blocked |
| Chat paired identity | 🟡 | Chat home, conversation header/composer/reply state, and voice/video shells now consume hydrated profile/partner names with mock-only persona fallbacks; source test added, execution blocked |
| Notification preference sync | 🟡 | Settings hydrates and persists the backend-supported master/messages/memories/occasions/quiet-hours contract, keeps unsupported device controls explicitly local, rolls back failures, and has HTTP/screen source tests; execution blocked |
| Account deletion lifecycle | 🟡 | Delete Account now reads durable status, schedules the real 30-day grace period, exposes cancellation, preserves the account on failures, and has HTTP/screen source tests; fake password/phone/email gates and false immediate-erasure claims were removed; execution blocked |
| Calendar CRUD and projections | 🟡 | Add/edit routes now call real providers, refresh upcoming projections, synchronize event state, and route into occasion details; occasion deletion is confirmed and removes stale Home/Calendar links; source tests added, execution blocked |
| Account data export | 🟡 | Data & Storage now requests the real account export, downloads JSON on web, opens the native share sheet on devices, prevents duplicate requests, reports failures, and restricts fabricated storage totals/cache actions to mock mode; HTTP/screen source tests added, execution blocked |
| Shared-space settings sync | 🟡 | Our Space now persists name, short name, and cover style through `PATCH /v1/pairing/space`, synchronizes the authoritative response, preserves local state on failure, and has HTTP/screen source tests; execution blocked |
| Personal profile settings sync | 🟡 | Personal Details persists supported profile fields and photos through the pairing provider, uses the authenticated email, preserves state on failure, and keeps unsupported phone verification mock-only; source tests added, execution blocked |
| Partner lifecycle settings | 🟡 | Partner settings schedules the real seven-day unpair grace period, displays pending ownership/date, supports cancellation, and never clears partner state on request/failure; source tests added, execution blocked |
| Provider-backed albums | 🟡 | Memories Home, album grid, and album detail read authoritative albums/counts/membership; album creation plus membership add/remove flows and HTTP/source coverage exist, memory edits use PATCH, and sample fallback is mock-only; executable verification blocked |
| Unsupported-operation gating | 🟡 | API builds disable Plans routes/tab, call controls, fake sessions/2FA, unenforced privacy/automation preferences, billing restore, and feedback submission; execution blocked |
| Final global palette and display type | ✅ source | Final ivory/aubergine theme grounds and editorial display type added to shared tokens |
| A01 native two-worlds reveal | 🟡 | Direct Expo/Reanimated implementation with replay, reduced-motion endpoint, responsive columns, and source test updates; executable verification blocked |
| A02–A09 Floating Glass auth redesign | 🟡 | Shared raised header, 32pt responsive inset, narrative eyebrows, assurance/status cards, raised illustration, strength surface, and source assertions implemented; executable and device verification blocked |
| Dependency installation | 🔴 blocked | npm registry unavailable; local package trees are incomplete |
| Frontend baseline | 🔴 blocked | `docs/redesign/evidence/BASELINE_2026-10-09.md` |
| Backend baseline | ✅ | 139 tests passed; `docs/redesign/evidence/BASELINE_2026-10-09.md` |
