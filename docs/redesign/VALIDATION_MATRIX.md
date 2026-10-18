# Validation and Quality Matrix

## Universal UI gates

| Concern | Required behavior |
|---|---|
| Submission | Disable or deduplicate while pending; never create duplicate mutations from repeated taps. |
| Field errors | Show adjacent to the field, retain user input, focus the first invalid field, and expose the error to assistive technology. |
| Request errors | Map stable error codes to product copy; retain safe input; show retry when retryable; retain request ID for support. |
| Offline | Distinguish offline from server rejection; do not imply that unsent work was saved. |
| Back/cancel | Preserve drafts where appropriate and confirm before abandoning destructive or substantial unsaved work. |
| Dates | Use explicit local-date semantics for birthdays/anniversaries and instants for events/messages; reject impossible and disallowed future dates. |
| Media | Request permission, validate type/size, show upload progress, support cancellation/retry, upload before storing returned URL. |
| Empty/loading | Use intentional skeleton/status/empty states; never render misleading sample content in real-provider mode. |
| Themes | Every testable screen runs in lavender and midnight Jest projects. |
| Accessibility | Unique labels, correct roles/states, logical focus order, touch target sizing, contrast, dynamic text, reduced motion. |
| Responsive | Verify 320 px, 390 × 844, representative Android, and web content column. |
| Privacy | Avoid sensitive values in logs, errors, analytics, URLs, and unprotected local persistence. |

## Feature validation baseline

| Feature | Client rules | Server authority |
|---|---|---|
| Sign up/sign in | Trim/lowercase email; password required; strength display and schema share one rule source | Identity uniqueness, credential validity, rate limits |
| Password reset | Token required; password rules; confirmation match | Token validity, expiry, single use |
| Profile | Required display name; bounded nickname/pronouns; valid birthday; media URL from uploader | Ownership and field limits |
| Pairing code | Normalize uppercase and separators; six characters | Existence, expiry, redemption, self-pairing, membership conflict |
| Story | Precision-aware met date; field limits; optional moments; safe future-date policy | Couple access and complete-replacement persistence |
| Calendar | Required title/date; end not before start; bounded reminder | Couple access and persisted constraints |
| Memory | Required title/date; photo/tag/album limits; URL validity | Couple access, ownership, reciprocal-note reveal |
| Chat | Kind-specific body/media requirements; client ID generated once | Couple access, idempotency, reply ownership, sender-only deletion |
| Daily Question | Nonblank answer, max 1500 | Same-day assignment and reciprocal reveal |
| Repair Signal | Confirmation on cancellation | One active signal, sender cancellation, 24-hour expiry |
| Plans | Feature-specific contracts pending | Shared ownership and concurrency rules pending |
| Period tracking | Valid cycle dates/ranges; estimates labeled; explicit share toggle | User ownership, revocable partner projection, audit-sensitive writes |

## Wave exit checks

- TypeScript compilation passes.
- ESLint passes.
- Dual-theme Jest suite passes.
- Web export passes.
- Relevant backend Maven tests pass.
- Relevant feature contract and implementation-matrix rows are updated.
- No unsupported control appears enabled.
- No mock/sample content leaks into configured real-provider mode.
