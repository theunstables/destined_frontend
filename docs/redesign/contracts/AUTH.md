# Authentication API contract

**Status:** Implemented in source; frontend execution blocked by unavailable dependencies  
**Screens:** A02–A09  
**Base URL:** `{PUBLIC_API_URL}/v1`

## Shared conventions

Successful JSON responses are wrapped as `{ "data": ... }`. Errors are:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Human-readable diagnostic",
    "issues": [{ "field": "email", "message": "Invalid value" }]
  },
  "requestId": "request-id"
}
```

The UI maps stable codes to product copy and never displays the server message directly. Email input is trimmed and normalized for submission. Password input is never logged or persisted. Mutations reject duplicate submission while pending.

## Session model

```json
{
  "user": {
    "userId": "uuid",
    "email": "alex@example.com",
    "emailVerified": true
  },
  "accessToken": "short-lived-jwt",
  "refreshToken": "opaque-single-use-token"
}
```

The HTTP adapter converts this transport object to the frontend `Session` domain type. Access tokens are bearer credentials. Refresh tokens rotate on every successful refresh and must use secure storage on native platforms. A refresh operation is single-flight: concurrent 401 responses wait for one refresh and retry at most once.

Sign-up, sign-in, forgot/reset password, resend verification, and logout use the
transport's public request mode. They do not hydrate, attach, or rotate an
existing bearer session. `/auth/me` and product operations remain authenticated.

## Operations

| Screen | Method | Path | Request | Success |
|---|---|---|---|---|
| A03 | `POST` | `/auth/signup` | `{ "email", "password" }` | `201 Session` |
| A02 | `POST` | `/auth/login` | `{ "email", "password" }` | `200 Session` |
| Bootstrap | `POST` | `/auth/refresh` | `{ "refreshToken" }` or supported secure cookie | `200 Session` |
| Sign out | `POST` | `/auth/logout` | refresh token when required | `204` |
| A05/A07 | `POST` | `/auth/password/forgot` | `{ "email" }` | `202` for known and unknown accounts |
| A06/A08 | `POST` | `/auth/password/reset` | `{ "token", "newPassword" }` | `200` reset acknowledgement; no session |
| A04 | `POST` | `/auth/verify-email/resend` | `{ "email" }` | `202` |
| A04 deep link | `GET` | `/auth/verify-email?token=...` | — | verified user wrapper |
| A04 return check | `GET` | `/auth/me` | bearer token | current user wrapper |

## Client validation

### Email

- Required after trimming.
- Must be syntactically valid.
- The client does not reveal whether an email exists during password recovery.

### Password creation/reset

- 8–128 characters.
- At least one number.
- At least one non-whitespace special character.
- Reset confirmation must match locally and is not sent to the server.

### Sign in

Only non-empty password validation is applied. The client must not reject a legacy password merely because it would fail current creation rules.

## Screen semantics

### A07 — Reset Link Sent

- Replaces the A05 form in place so the submitted email and back stack remain stable.
- Copy is conditional: “If this address has an account…”
- Resend is independently loading and reports network/rate-limit errors.
- Future cooldown metadata may disable resend; until the server returns it, the client must not invent an inaccurate countdown.

### A08 — Password Updated

- Replaces A06 in place after reset succeeds.
- Navigates to Sign In, not Home: reset revokes sessions and returns no authenticated session.
- Uses “Password updated” and explicitly tells the user to sign in with the new
  password; it must not claim the user is already back in.
- Uses the approved “Return to Sign In” action label and politely announces the
  in-place success heading to assistive technology.

### A09 — Sign In Error

- Remains a substate of A02.
- Preserves email and clears password.
- Places the generic credentials error beneath the password field and applies
  the field error border without disclosing whether the email exists.
- Announces the inline error as an accessibility alert/live region.
- Provides Forgot Password without removing the ability to retry.

### A04 — Verify Email authority

- Resend sends the email from the signed-in session; it must never submit an
  empty placeholder value.
- If that session identity is unavailable, resend stays local, displays a
  recovery error, and does not call the API with an empty email.
- In configured API mode, tapping “I've Verified” reads `/auth/me` and advances
  only when `emailVerified` is true.
- `EMAIL_ALREADY_VERIFIED` from resend is treated as authoritative completion:
  local session state is marked verified and the flow advances to onboarding.
- The in-memory showcase has no mail server and retains an explicit manual
  continuation path. This exception is isolated by provider mode and is not
  used by a configured production build.

## Stable error handling

| Code | UI behavior |
|---|---|
| `INVALID_CREDENTIALS` | A09 generic credentials error; never identify which field was wrong. |
| `EMAIL_NOT_VERIFIED` | Preserve session and route to A04. |
| `EMAIL_ALREADY_EXISTS` / `ACCOUNT_CONFLICT` | A03 form-level conflict with Sign In recovery. |
| `WEAK_PASSWORD` | A03/A06 password field error consistent with local rules. |
| `TOKEN_INVALID` | A06 invalid-link state with request-new-link action. |
| `TOKEN_EXPIRED` | A06 expired-link state with request-new-link action. |
| `EMAIL_ALREADY_VERIFIED` | Treat resend as completed, mark the session verified, and continue to onboarding. |
| `VALIDATION_ERROR` | Map field issues by field; otherwise form-level error. |
| `RATE_LIMITED` | Keep input, stop loading, explain retry later. |
| `NETWORK` | Keep input and offer retry. |
| unknown server code | Generic recoverable error plus request ID in diagnostics, not primary copy. |

## Security and privacy

- Forgot-password responses must be indistinguishable for registered and unregistered email addresses.
- Verification and reset tokens are opaque, single-use, time-limited, and may only arrive through deep links/email.
- Password-reset mail targets `{PUBLIC_APP_URL}/reset-password?token=...`.
  `PUBLIC_APP_URL` may be a web origin or the `talesoftwo://` Expo scheme. It is
  distinct from `PUBLIC_API_URL`, which remains the verification/API origin.
- Tokens must be removed from navigable history where platform routing permits.
- Logout clears local credentials even when server revocation fails.
- No credential, token, or password is written to analytics, logs, Zustand persistence, or error reporting.

## Existing backend mapping

The operations above exist in `destined_backend-main` under `AuthController`, `AuthService`, and the auth DTO records. The frontend HTTP adapter and transport already exist; this redesign verifies and corrects their screen-level use before creating any endpoint.

## Open contract decisions

- OAuth/OIDC for Apple and Google is not implemented. Controls remain disabled and accessibility-disabled until provider contracts and credentials exist.
- Signed-in email change and password change are separate account-security capabilities and are not inferred from reset endpoints.
- `/auth/me` exists and is the authority for the current verification flag after
  the user returns from email. Cold-start bootstrap still uses refresh before
  reading the current user.
- A production native build still requires a keychain-backed storage adapter;
  the current memory adapter intentionally signs out on process restart.
