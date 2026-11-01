# Resend Setup for Tales of Two

## Status

The active backend, `destined_backend`, now supports `MAIL_DRIVER=resend`. It sends verification and password-reset emails to Resend over HTTPS, so it does not depend on SMTP ports blocked by free Render services. Console and SMTP modes remain available.

The changes are local, not committed, pushed, or deployed. No real API key is stored in this repository. Local verification passed 38 focused mailer/auth tests and produced the backend JAR. Provider responses were mocked; actual delivery still requires the steps below.

## 1. Create and Configure Resend

1. Create an account at https://resend.com and use its transactional Free plan. At the time of this change, the published allowance is 3,000 emails/month, limited to 100/day; confirm the current limits in your dashboard.
2. In Domains, add `mail.talesoftwo.world` as the sending domain. It must be a domain/subdomain whose DNS you control.
3. Add exactly the DNS records Resend displays at the DNS provider for `talesoftwo.world`. Do not guess record names or values. Do not remove the website's existing A/CNAME records or existing root-domain mail records. Apply mail-related records only to the hostnames specified for the new sending subdomain.
4. Wait until Resend marks the sending domain Verified. Add its recommended DMARC configuration without overwriting an existing policy. Keep click tracking off for authentication emails.
5. In API Keys, create a key with sending permission, scoped to this domain where supported. Put it directly into Render in the next step. Do not paste it into chat, screenshots, source files, commits, or frontend environment variables.

Use the verified sending domain for the From address. The QA Outlook mailbox is a recipient; it is not the application's sending service.

Official instructions: https://resend.com/docs/add-a-domain

## 2. Configure the Render Backend

Open the Render web service that serves `destined-backend-rixf.onrender.com`, not the frontend deployment. Set these environment variables:

| Variable | Value |
| --- | --- |
| `MAIL_DRIVER` | `resend` |
| `RESEND_API_KEY` | The actual sending API key, entered privately in Render |
| `MAIL_FROM` | `Tales of Two <no-reply@mail.talesoftwo.world>` |
| `FRONTEND_URL` | `https://www.talesoftwo.world` |
| `PUBLIC_API_URL` | `https://destined-backend-rixf.onrender.com` |

Use the plain values in Render's environment editor; do not add quote characters. Adjust `MAIL_FROM` only if you verified a different sending domain. Do not use the example domain unless Resend has verified it for your account.

`FRONTEND_URL` is new. It tells the mailer where the website's `/verify-email` and `/reset-password` screens live. It must be an absolute HTTPS URL with no credentials, query string, or fragment. `PUBLIC_API_URL` remains the backend address and is also used by media URLs; do not replace it with the website address.

Do not run the deployment with `SPRING_PROFILES_ACTIVE=pgdev` or `postgres`: these development profiles force console mail. Preserve your existing production database, JWT, media, and CORS settings. SMTP variables are not used by the Resend branch and are not required for it.

Selecting Resend with a blank key or missing/invalid `FRONTEND_URL` now fails startup with a configuration error. An unrecognized `MAIL_DRIVER` also fails startup instead of silently trying SMTP.

## 3. Deploy the Updated Backend

Make sure the following changes reach the repository/branch connected to Render:

- [Mailer.java](../../destined_backend/src/main/java/com/loveos/api/infra/Mailer.java)
- [application.yml](../../destined_backend/src/main/resources/application.yml)
- [MailerTest.java](../../destined_backend/src/test/java/com/loveos/api/infra/MailerTest.java)

Publish them using your normal workflow and trigger a Render deployment of that revision. Include your required ticket ID if your repository enforces one in commit messages. No frontend rebuild or database migration is needed for this change.

Do not expect setting `MAIL_DRIVER=resend` on the old deployed code to enable Resend. The new backend build must be deployed as well. If saving environment settings triggers a deployment before the new source is published, redeploy again once the new revision is available.

## 4. Verify Actual Delivery

1. Use the existing QA account. Do not sign up again with the same address. In the retained verification session, click Resend Email once after its cooldown has ended.
2. If that browser session is no longer available, use Forgot Password with the QA address, open the fresh password-reset link, and set a password privately. The earlier generated QA password was not saved in the repository. Sign in afterward and resend verification as needed.
3. In Render logs, find `Email accepted by resend` with a `messageId`. In Resend's email log, inspect the matching message's delivery outcome.
4. Check the QA mailbox's Inbox, Junk, and corporate quarantine if needed. The verification subject is `Confirm your email`; it contains a link, not an OTP code.
5. Open the newest verification link. It should open `https://www.talesoftwo.world/verify-email?token=...`, verify with the backend, and continue appropriately. If opened without the existing session, sign in afterward. Do not copy the token into chat or logs.
6. Also verify the password-reset link opens the website and that the new password works. Never share the password in chat.

Resend acceptance is not the same as recipient delivery. HTTP 201/202 from the application's auth endpoints is not delivery confirmation either. The existing account-enumeration protections and nonfatal mail-failure behavior were preserved, so provider failures do not change the auth API response contract.

## Troubleshooting

| Observation | Next check |
| --- | --- |
| `EMAIL (console driver)` | Wrong/missing `MAIL_DRIVER`, a development profile, or old code/config is deployed. Console mode only logs the email. |
| Startup error mentions `RESEND_API_KEY` / `FRONTEND_URL` | Set both on the backend service, without placeholder values. |
| `Email delivery via resend rejected` with status 401/403 | Check the sending key, its permissions, verified domain, and From address in Resend. |
| Rejection with status 429 | Check the daily/monthly quota and API rate limits. Retry later; do not repeatedly click resend. |
| Status 5xx or `failureType=ResourceAccessException` | Check provider availability and outbound HTTPS reachability. Connect timeout is 3 seconds; request/read timeout is 8 seconds. |
| Failure with no provider message ID | Inspect Resend's dashboard; the response was missing or malformed. It is not logged as accepted. |
| Accepted message ID but no mailbox arrival | Check Resend delivery/bounce details, recipient quarantine, DNS verification, and sender reputation. |
| Verification link is expired or already used | Request a fresh link once. Older links may be invalidated by resends. |

Production-path failure logs intentionally omit API keys, recipient addresses, email bodies, raw provider errors, and verification tokens. Keep provider dashboards and any message content private. Console mode still logs full development emails and should not be used in production.

The implementation does not add a queue, automatic retries, delivery webhooks, or inbox assertions. Those are separate reliability improvements; the setup is complete only after the actual mailbox/link checks pass.

## Local Verification

From the active backend directory, with Java 21 and Maven available:

```powershell
mvn "-Dtest=MailerTest,AuthServiceTest,AuthControllerContractTest" package
```

Verified: 23 mailer cases, 4 auth-service cases, and 11 auth-controller contract cases; 38 passed, zero failures. This was focused verification, not the entire repository test suite. No live Resend request was made by these tests.