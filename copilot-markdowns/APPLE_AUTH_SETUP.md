# Apple Signup and Login Setup

## Status

Apple signup, returning-user login, and explicit Connect Apple in Security settings are implemented locally. The frontend uses the existing system-browser/popup flow and a dedicated callback page. The backend exchanges Apple's authorization code, verifies the identity token, and issues the app's normal session.

No Apple account configuration, private key, real-provider login, production deployment, or native-device verification has been performed. Apple stays disabled while all Apple credentials are absent. Partial or invalid signing configuration fails backend startup.

## Credentials Still Needed

See the consolidated [pending-credentials checklist](CREDENTIALS_CHECKLIST.md). It records the outstanding GitHub PAT, Google client ID/secret, Apple credentials, and email-provider setup without storing secrets.

For Apple, obtain:

- **Services ID:** the OAuth client identifier for this server-mediated web flow.
- **Team ID:** the 10-character Apple Developer Team ID.
- **Key ID:** the 10-character ID of the Sign in with Apple signing key.
- **`.p8` private key:** download it from Apple and keep it securely. Apple may only permit downloading a newly created key once.

Apple's web configuration requires a Services ID associated with an existing primary Apple-platform App ID enabled for Sign in with Apple. Check Apple Developer Program membership eligibility and fees before enrolling; this is separate from free Render hosting. Do not assume a free Apple Account provides these capabilities.

## Apple Developer Configuration

1. Enable Sign in with Apple on the relevant primary App ID.
2. Register a Services ID for Tales of Two and associate it with that primary App ID.
3. Configure the website domains/subdomains required by Apple, including the frontend and backend callback hosts used for this deployment.
4. Register this exact return URL:

```text
https://destined-backend-rixf.onrender.com/v1/auth/apple/callback
```

5. Create a Sign in with Apple key associated with the primary App ID. Keep its `.p8` file and Key ID secure.
6. If sending verification/recovery emails to Hide My Email addresses, register the actual sending domain/address with Apple's private email relay service and complete its SPF/DKIM requirements. Resend configuration alone does not establish Apple's relay sender registration.

Official web setup: https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web

The provider return URL is the backend URL above, not `/apple-callback` on the website. Apple posts the result as `application/x-www-form-urlencoded`; the backend returns a 303 redirect to the appropriate app callback without forwarding Apple's tokens.

## Render Environment

Set these on the **backend service**:

```dotenv
APPLE_CLIENT_ID=<your Services ID>
APPLE_TEAM_ID=<10-character Team ID>
APPLE_KEY_ID=<10-character Key ID>
APPLE_PRIVATE_KEY_BASE64=<base64 of the complete .p8 PEM file>
APPLE_NATIVE_REDIRECT_URI=talesoftwo://apple-callback
PUBLIC_API_URL=https://destined-backend-rixf.onrender.com
FRONTEND_URL=https://www.talesoftwo.world
```

`APPLE_PRIVATE_KEY_BASE64` is the base64 encoding of the entire downloaded PEM file, including its BEGIN/END markers. Encode it privately on your machine and enter it directly in Render. Base64 is not encryption. Do not paste the key or encoded value into chat, screenshots, source code, or frontend environment variables.

The backend generates a fresh **five-minute ES256 client-secret JWT** for token exchange from the key. It uses the Team ID as issuer, Services ID as subject, Key ID in the header, and Apple's audience. You do not need to manually generate a six-month client-secret string.

No Apple secret belongs in `EXPO_PUBLIC_*` variables. Keep the existing Google, Resend, database, JWT, CORS, and GitHub-media settings unchanged.

## Deployment and Behavior

- Deploy the backend so Flyway applies **V15**, adding the Apple identity binding and short-lived authentication-flow table. Deploy the matching frontend too.
- Continue with Apple is wired on both signup and login. New identities create an email-verified account without a fake password; returning identities use Apple's stable subject to find the same account.
- Hide My Email relay addresses are supported. The app does not depend on Apple's first-login-only `user` object or name fields; identity/email come from the server-verified token, and the app collects profile details in onboarding.
- Matching email alone never merges accounts. If an account already exists, sign in through its existing method, open Security, and choose Connect Apple.
- Explicit linking requires a verified signed-in app account and a successfully verified Apple flow. A relay email may differ from the app account's email; linking preserves the app email/password. An Apple subject already attached to another user cannot be stolen or reassigned.
- Browser callbacks require the same website origin as the initiating login page. Native return uses the existing `talesoftwo` app scheme and the system browser; it is not a native Apple SDK authorization sheet. Test actual development/production iOS and Android builds rather than assuming Expo Go supports this callback.
- State/nonce checks and a single-use two-minute handoff bound to the initiating client's secret protect against replay and login substitution. App tokens and Apple's ID token are not put in redirect URLs. Closing/cancelling the flow does not issue a client session.
- Only Apple's origin is allowed through the callback-specific CORS policy; other API routes retain the app's original CORS restrictions. CORS is not the authentication proof: state and token verification still apply.

## Verification Performed

The combined backend run passed **64 selected tests** and produced the deployable JAR. Coverage includes Apple token verification, boolean/string email-verification claims, client-secret signing, expiry, cancellation, single-use exchange, relay signup/login/linking, Apple HTTP callbacks, existing Google flows, strict media access, actual Spring Security/CORS, and genuine PostgreSQL/Flyway startup.

Direct execution of the transpiled Apple client service passed success, secret-bound exchange, cancellation, and invalid-callback checks with mocked APIs. Parsing 187 frontend auth/profile/route source and test files found zero syntax errors; this is not semantic typechecking or a Jest run.

Full frontend Jest/Expo/rendered-browser/native-device tests remain pending the previously documented dependency issue. No real Apple credential was used by the tests.

## Live QA After Setup

1. New Apple user: signup -> Apple approval -> app session -> onboarding.
2. Returning Apple user: login -> same app account, without relying on the first-login `user` object.
3. Repeat with Hide My Email and verify recovery email delivery through the registered relay sender.
4. Existing app account: sign in, connect Apple, then log out and sign in with Apple. Confirm existing couple/data are preserved.
5. Cancel the popup/system browser and retry. Reject a reused or modified callback/handoff.
6. Check actual iOS/Android return navigation and web popup behavior on narrow/mobile browsers.

## Explicit Limits

Provider-token revocation during account deletion, Apple server-to-server account-change notifications, ongoing Apple refresh-token checks, unlinking identities, and a native Apple SDK button/sheet are not implemented here. The app retains its existing session lifetime/logout behavior. Treat those lifecycle/App Store compliance items as follow-up requirements before claiming full production/App Store readiness.