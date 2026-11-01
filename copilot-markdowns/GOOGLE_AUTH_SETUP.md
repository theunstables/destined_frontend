# Google Signup/Login and Strict Media Setup

## Implementation Status

Local code now includes Google signup, returning-user login, and explicit linking from Settings -> Security. It uses a server-mediated authorization-code flow with PKCE, state, nonce, verified Google ID tokens, and a short-lived single-use handoff bound to the initiating client. Google client secrets, Google tokens, and app access/refresh tokens are never placed in redirect URLs.

The existing app session/refresh/logout system is reused. A Google account is identified by Google's immutable `sub`, not by email. An existing password account is not automatically merged by matching email: sign into the verified existing account first, then Connect Google using the same email. Gmail and verified Workspace addresses can bypass app email verification; third-party Google-account addresses still use the app's email-verification flow because Google is not authoritative for those mailboxes.

The web signup/login buttons, popup callback, and native system-browser return path are implemented. No Google Cloud configuration, client credentials, production deployment, or real-provider/native-device login has been performed.

## 1. Configure Google Cloud

1. Create/select a Google Cloud project and configure its OAuth consent screen (Google Auth Platform).
2. Configure the app name, support contact, audience, and your actual public home/privacy/terms URLs. Use Testing while setting up and add your QA Google accounts as test users. Complete Google's publishing/verification requirements before opening access broadly.
3. Create an OAuth client with application type **Web application**. This backend-mediated implementation uses that one client for both web and native app flows; it does not embed a web client secret in a mobile app.
4. Register this exact **Authorized redirect URI**:

```text
https://destined-backend-rixf.onrender.com/v1/auth/google/callback
```

5. The frontend origin is `https://www.talesoftwo.world`. You may register it as an authorized JavaScript origin. The actual Google OAuth redirect is the backend URI above, not the frontend handoff page.
6. Obtain the client ID and client secret. Enter the secret directly into Render, not chat, screenshots, frontend variables, or source files. If you use a custom API domain, use its exact HTTPS callback in both Google Cloud and `PUBLIC_API_URL`.

This flow requests only the standard identity scopes (`openid email profile`), not Gmail, Drive, or contacts access. Google Sign-In does not provide access to a user's mailbox.

## 2. Set Render Backend Variables

```dotenv
GOOGLE_CLIENT_ID=<Google Web application client ID>
GOOGLE_CLIENT_SECRET=<client secret entered privately>
PUBLIC_API_URL=https://destined-backend-rixf.onrender.com
FRONTEND_URL=https://www.talesoftwo.world
GOOGLE_NATIVE_REDIRECT_URI=talesoftwo://google-callback
```

Do not add quote characters in Render's value editor. `PUBLIC_API_URL` remains the backend address; `FRONTEND_URL` is the exact website origin users open. Google settings are optional until configured: with both credentials absent, the backend reports Google disabled and the UI keeps the button disabled. Partial credentials or invalid redirect configuration fail startup.

Keep the existing JWT/database/CORS/Resend settings. Resend is still needed for password recovery and third-party-email verification. Never add `GOOGLE_CLIENT_SECRET` or the GitHub PAT to `EXPO_PUBLIC_*` variables. No Google secret or client ID needs to be configured in the frontend for this flow.

## 3. Deploy Backend and Frontend Together

- V13 creates `media_assets` ownership records. V14 adds Google identities and temporary OAuth-flow records. Back up the database and deploy the backend so Flyway applies them.
- Deploy the matching frontend afterward. Old frontend builds cannot fetch the newly protected images because they do not attach app authentication.
- For web, ensure the exported `/google-callback` route is deployed and `FRONTEND_URL` uses the same origin as the login page. For example, starting on the apex domain and returning to `www` is a different origin and will not complete the popup.
- For native, build a development/production app with the `talesoftwo` scheme already in the app configuration. Test iOS and Android system-browser return behavior. Do not assume Expo Go supports the custom-scheme callback.

The client reserves the browser popup during the click, validates the callback origin/path/state, and retains the handoff secret in memory only. Closing/cancelling the provider flow creates no client session. Reloading the original login window abandons that attempt; start again.

## Strict Image Privacy

See [GitHub media setup](GITHUB_MEDIA_SETUP.md) for the updated storage instructions.

- Both old and new backend media paths require app authentication and a current matching couple ownership record. Old signatures do not grant access.
- `MEDIA_GITHUB_SIGNING_KEY` is obsolete; the PAT remains server-side for GitHub storage.
- Existing files without ownership metadata are not automatically claimed. Re-upload them or perform an explicit migration using trusted ownership evidence. Do not guess ownership from a supplied URL or filename.
- Web images are displayed through temporary browser object URLs; native images use locally decoded authenticated bytes. These resources are discarded when their user/partner context changes or they unmount.
- Authorized viewers can still download or screenshot what they can view. Public third-party asset URLs and already-public S3 files are outside the backend authorization boundary and must be made private/migrated separately.
- GitHub file/history deletion, existing-file migration, per-device token revocation, Google unlinking, and offline private-media caching are not included in this change.

## Verification Checklist

1. New Gmail/Workspace user: Continue with Google on signup -> consent -> verified app session -> onboarding.
2. Returning Google user: Continue with Google on login -> same app user, no duplicate account.
3. Existing password account: Google login must show an account-conflict recovery message. Sign in normally, open Security, and Connect Google with the matching account. A different email must be refused.
4. Cancel or close the Google popup: no session is created. Retry works. Reusing a consumed handoff code or changing its client secret/state must be rejected.
5. Third-party Google email: app email verification remains required until its own verification link is used.
6. Upload a new QA image. The owner and partner can view it; an anonymous browser and a different couple cannot. Copying the backend URL alone must not grant access.
7. Log out/switch accounts, then verify private images are cleared. Test web, Android, and iOS, including expired-token refresh and permission/error states.

## Local Checks

The final selected backend run passed **45 tests** and packaged the backend JAR. Tests cover Google signature/claims, OAuth state/PKCE/nonce, cancellation, expiry/replay, account creation/linking, returning Google users, and strict media reads. Real embedded PostgreSQL startup, Flyway migrations, and anonymous-media rejection through the real Spring Security chain were verified. Five frontend callback checks, five private-media origin checks, and the Google client success/secret-bound exchange/cancellation paths were executed with mocked APIs. Parsing 714 frontend source/test files reported zero TypeScript syntax errors; that is not semantic typechecking or a Jest run.

Full frontend Jest, browser-rendered UI, and native Google/provider tests remain pending dependencies and credentials. Local files are not a deployed release. No production settings or user accounts were changed during this implementation.