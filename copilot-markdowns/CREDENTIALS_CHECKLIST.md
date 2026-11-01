# Pending Credentials and Setup

These are still to be generated/configured by the owner. No real secrets belong in this file, chat, source code, or frontend `EXPO_PUBLIC_*` variables.

- [ ] GitHub: dedicated initialized private media repository, owner/repository/branch, and fine-grained PAT restricted to that repository (Contents read/write and metadata read). Render variable: `MEDIA_GITHUB_TOKEN`.
- [ ] Google: Web OAuth client ID and client secret. Render variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- [ ] Apple: Services ID, Team ID, Key ID, and Sign in with Apple `.p8` private key. Render variables: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY_BASE64`.
- [ ] Apple: primary App ID with Sign in with Apple, configured website domain/return URL, and private-email-relay sender registration if sending mail to Hide My Email addresses. Check Apple Developer Program membership eligibility/cost before proceeding.
- [ ] Resend: verified sending domain and sending API key for verification/password-reset emails. Render variable: `RESEND_API_KEY`.
- [ ] Deploy the matching backend/frontend, apply Flyway migrations, and run real-provider and paired-account media checks.

GitHub media signing keys are obsolete: strict image reads use app authentication and couple ownership. Apple client-secret JWTs will be generated server-side from the `.p8` key; do not generate or hardcode a long-lived Apple client-secret string.

Setup guides: [GitHub media](GITHUB_MEDIA_SETUP.md), [Google authentication](GOOGLE_AUTH_SETUP.md), [Apple authentication](APPLE_AUTH_SETUP.md), [Resend](RESEND_SETUP.md).

Apple signup/login/linking code is now implemented and locally tested. These checkboxes remain pending until the owner actually generates the credentials, configures the providers, deploys, and completes live testing.