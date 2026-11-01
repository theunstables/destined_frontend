# Live Site Audit

Target: https://www.talesoftwo.world/welcome

## Verification Delivery Investigation - 2026-11-01

Used the mailbox explicitly authorized by the user as the QA identity. Its address, generated password, and any verification tokens are not recorded in this report.

### Live Evidence

- One verification-resend request returned HTTP 202, request ID `8c7d78b7-8516-4c58-a486-f02b130c0e71`.
- A subsequent QA registration returned HTTP 201, `emailVerified: false`, request ID `721ec98e-f1e6-458f-9b47-403f3f1d9c25`. The browser reached `/verify-email`. The account was newly created; therefore the earlier resend was for an unregistered address, for which the backend intentionally returns 202 without sending anything.
- After registration, classic Outlook automation connected to the authorized account. Read-only searches were limited to Inbox and Junk, the expected subject `Confirm your email`, recent receipt dates, and this application's identifiers. No message bodies, codes, or verification links were printed.
- The final check at `2026-10-31T21:12:54.5713593Z` found zero matching verification messages; Outlook reported `Offline: false`.
- This confirms successful registration and no observed delivery in the checked folders at that time. It does not distinguish an SMTP/configuration failure from delayed mail, rules moving mail elsewhere, or corporate quarantine.
- The isolated QA Edge session was left on the verification screen to permit continuation. Its temporary password was not printed or saved to the repository. Outside that session, use password recovery once email delivery is working; no existing account password was changed.

### Verified Source Behavior

- [Mailer](../../destined_backend/src/main/java/com/loveos/api/infra/Mailer.java) sends a verification **link**, not a numeric code, with subject `Confirm your email`.
- [Application configuration](../../destined_backend/src/main/resources/application.yml) defaults `MAIL_DRIVER` to `console`. That driver logs the message instead of sending it. The `postgres` and `pgdev` development profiles explicitly select console delivery as well.
- SMTP defaults to `localhost:1025`, with authentication and TLS disabled unless configured. These are development defaults, not a working external mail service.
- SMTP exceptions are logged and swallowed by Mailer. Account creation/resend can therefore return success even when the SMTP sender fails. HTTP 201/202 is not an inbox-delivery assertion.
- [AuthService](../../destined_backend/src/main/java/com/loveos/api/auth/AuthService.java) deliberately returns silently when a resend address does not exist. Tests must establish account registration before interpreting a 202 as a mail attempt.

These are source-level facts, not confirmation of the live service's environment values.

### Required Deployment Check

Inspect the deployed service's non-secret settings: `MAIL_DRIVER`, `SPRING_PROFILES_ACTIVE`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_AUTH`, `SMTP_TLS`, `MAIL_FROM`, and `PUBLIC_API_URL`. Do not paste SMTP passwords, API keys, or verification-token log lines into chat.

Correlate the registration request ID above with Render logs:

- `EMAIL (console driver)` means no SMTP message was sent; configure a real mail transport and do not deploy using a console-forcing development profile.
- `failed to send` means the request was accepted despite a transport failure; inspect the sanitized exception and the provider's submission/delivery logs.
- If the provider accepted/delivered the message, investigate the recipient's quarantine and folder rules before blaming the app's mail transport.

[Render documents](https://render.com/docs/free#other-limitations) that free web services block outbound ports 25, 465, and 587. If this service is free, ordinary SMTP on those ports cannot work; use an email provider's supported unblocked transport or HTTPS API, or an appropriate paid compute plan. Port 25 is blocked on all Render services. The current service's plan has not been verified.

Production settings/log access were unavailable during this run. No mail-provider migration, SMTP-secret changes, or deployment was attempted. The next verification gate must include actual receipt of a fresh verification message and successful use of its link, not only an API success response. The existing public suite's intercepted-mail tests do not establish that gate.

## Edge Follow-Up - 2026-11-01

Executed real Playwright interactions in Microsoft Edge 156.0.4314.50, launched through the editor's existing Playwright runtime. A new browser process used a temporary profile, not the user's normal Edge profile. The debugging listener was verified at `127.0.0.1:9333`; the test browser was closed after the run. No existing browser tabs were reused.

### Results

- Passed eight navigation/validation checks: welcome to sign-up, empty sign-up, sign-up to sign-in, empty sign-in, password reveal/hide, empty recovery, recovery to sign-in, and missing-reset-token recovery.
- Passed all eight signed-out guards: Home, Calendar, Chat, Memories, Timeline, Profile, Plans, and Setup.
- Reproduced WEB-001: four links work by pointer but not Enter. Reproduced WEB-002: all three auth forms submit by button but not Enter.
- Reproduced WEB-003: `/verify-email` without a session/token still claims a verification email was sent. Reproduced WEB-004: all six public pages still have empty titles.
- All three forms displayed an intercepted rate-limit error and restored the submit control. No actual sign-up or recovery-email requests were sent.
- Passed the settled recovery workflow: simulated HTTP 202 success, account-neutral messaging, HTTP 429 on resend, successful retry, and return to sign-in. The initial false attribution of a permanently broken/pointer-only Resend control was ruled out; see WEB-008 below.
- Passed horizontal-layout checks on six public pages at 320x568 and 390x844 (12 combinations). The welcome lock icon was initially still loading; awaiting image decode confirmed that it loaded successfully. It is not a broken-asset finding.
- A single deliberately invalid login in a clean browser process timed out after approximately 16.1 seconds with `net::ERR_ABORTED` and the UI message `No connection. Check your network and try again.` No HTTP response was observed. This demonstrates failure from this environment, not a proven global backend outage. An earlier probe blocked by the test harness was discarded and is not site evidence.

### WEB-008 - Rapid Recovery Action Is Silently Ignored

Priority: P3. This is a short interaction-state race, not a permanently dead Resend button.

1. On `/forgot-password`, submit a valid-format address and intercept the request with HTTP 202 and `{ "data": null, "meta": {} }`.
2. The screen changes to `Check your email`; `Resend` is visible and its native `disabled` property is false.
3. Immediately activate Resend. The initial request count remains one and no feedback appears. This reproduced with both pointer and keyboard activation.
4. A later activation sends the next request. Advancing the browser clock by 650 ms before activation also makes it work; the complete error/retry flow then passes.

The nearby [Button implementation](../src/design-system/primitives/Button.tsx) retains an `isHandling` ref for 600 ms after every press. The lock is not reset when a reused button changes its label/callback from Send Reset Link to Resend, and it is not represented as a disabled state. This matches the observed timing. Preserve duplicate-submission protection, but reset it for a genuinely different action or accurately represent non-interactivity to the user.

Added three recovery scenarios to [the existing suite](../e2e/tests/public-flows.spec.mjs): rapid pointer activation, rapid keyboard activation, and a settled-timer control. Rapid scenarios assert that the new enabled action issues its request; the settled control verifies account-neutral success, resend rate limiting, retry, and navigation. The API responses are intercepted and never send email.

### Evidence And Reproduction

Local screenshots and traces are in [e2e/test-results/edge-live-2026-11-01](../e2e/test-results/edge-live-2026-11-01/). These generated files are ignored by Git; they are not committed evidence.

- [Navigation trace](../e2e/test-results/edge-live-2026-11-01/navigation.zip)
- [Keyboard and form submission trace](../e2e/test-results/edge-live-2026-11-01/keyboard-and-submit.zip)
- [Settled recovery control trace](../e2e/test-results/edge-live-2026-11-01/recovery-settled-control.zip)
- [Recovery error screenshot](../e2e/test-results/edge-live-2026-11-01/recovery-resend-error.png)
- [Missing-session verification screenshot](../e2e/test-results/edge-live-2026-11-01/verification-without-session.png)
- [Clean invalid-login trace](../e2e/test-results/edge-live-2026-11-01/invalid-login.zip)
- [Mobile layout trace](../e2e/test-results/edge-live-2026-11-01/mobile-layouts.zip)

The suite now has 63 scenarios and an additional `desktop-edge` project. The manual CI workflow installs Edge alongside Chromium and WebKit. From `e2e`, after dependencies are available, run `npm test -- --project=desktop-edge --headed`. This launches a separate temporary-profile Edge instance; no personal browser profile is required.

Node is now 22.23.4. npm still returns HTTP 503; Python package downloads were also blocked, and the unused Python environment was removed. The working route was the editor's Playwright runtime, which can launch Edge and connect to its CDP endpoint. The earlier conclusion that external Edge attachment was unavailable was incorrect.

These are executed Edge browser probes, not a complete `npm test` run. Test source syntax/editor checks passed; the expanded CLI suite and updated CI workflow have not run. No QA login was available, so successful authentication, pairing, Chat, Memories, Plans, session persistence, real email delivery, and two-account synchronization remain unverified. No application fixes were made.

## Original Result - 2026-10-25

Seven reproducible public-site findings. The site should not be signed off as fully tested. Authenticated product flows were not accessible without a dedicated QA session.

Executed against the deployed site using the integrated Chromium browser, Playwright interactions, DOM measurements, and axe-core 4.10.3. Viewports: 320x568, 390x844, and 1440x900. These were viewport emulations, not physical-device or Safari runs.

At the initial audit, the repository contained 60 browser scenarios configured for desktop Chromium, mobile Chromium, and mobile WebKit (180 configured test executions). This was the suite size, not a claim that all 180 executions ran. Full CLI execution and WebKit verification were blocked locally by npm registry access.

## Confirmed Findings

### WEB-001 - Keyboard users cannot activate auth navigation links

Priority: P1. Reproduced at desktop and mobile widths.

1. Open `/welcome`, focus `Sign In`, and press Enter.
2. The URL remains `/welcome`. Clicking the same link navigates to `/sign-in`.
3. The same failure occurs for `/sign-in` -> `Create an account`, `/sign-in` -> `Forgot password?`, and `/sign-up` -> `Sign In`.

Expected: keyboard activation performs the same navigation as a pointer click.

Observed DOM: focusable `span`/`div` elements with `role="link"`, but no native anchor navigation. Nearby implementation: [FooterPrompt](../src/design-system/patterns/FooterPrompt.tsx) and [SignInScreen](../src/modules/module-00-auth/screens/SignInScreen.tsx).

Coverage: four `supports keyboard activation` tests and four corresponding pointer controls.

### WEB-002 - Enter does not submit any of the three auth forms

Priority: P2. Confirmed with intercepted requests, not production account creation or email delivery.

1. Fill syntactically valid values on `/sign-in`, `/sign-up`, or `/forgot-password`.
2. Press Enter in the password field, or the email field for recovery.
3. No API request occurs. Clicking the submit button immediately produces one request to the appropriate endpoint.

The empty-field probe also showed only focused-field blur validation on sign-in/sign-up, rather than a full form submission. Local [FormField](../src/components/forms/FormField.tsx) and [Input](../src/design-system/primitives/Input.tsx) do not wire a submission callback.

Expected: Enter submits through the same validation/loading/error path as the button, once only.

Coverage: three `Enter submits valid fields (intercepted API)` regressions and three click controls. Intercepted `429 RATE_LIMITED` responses verify that feedback appears and the submit button becomes usable again.

### WEB-003 - Verification route presents a nonexistent signed-out session

Priority: P2. This is a recovery/identity-state defect, not a demonstrated authorization bypass.

1. Open `/verify-email` with no session and no verification token.
2. The page says `We sent a verification link to your email.` and starts a resend countdown despite having no email identity.
3. Click `I've Verified`. The backend responds `401`; the UI displays `Your session has ended. Please sign in again.` but stays on the verification screen without a direct Sign In action.

Expected: return to authentication, or render an explicit expired/missing-session state with a working sign-in action. Valid token links must remain supported.

Nearby implementation: [VerifyEmailScreen](../src/modules/module-00-auth/screens/VerifyEmailScreen.tsx).

Coverage: `verification without a session or token returns to authentication`. This regression currently chooses the redirect behavior; an explicit recovery-state implementation would need an equivalent assertion instead.

### WEB-004 - All six public pages have an empty browser title

Priority: P2. axe rule: `document-title`, WCAG 2.4.2.

After the actual UI rendered, `document.title` was empty on `/welcome`, `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, and `/verify-email`.

Expected: meaningful page-specific browser titles. Empty titles impair tab identification, browser history, and assistive navigation.

Coverage: six title assertions plus six automated accessibility scans.

### WEB-005 - Welcome lock image has no alternative-text semantics

Priority: P2. axe rule: `image-alt`.

The welcome footer lock image has no `alt` attribute, accessible name, or presentation role. Reading the DOM `image.alt` property alone returns an empty string and hides the distinction between a missing attribute and deliberate `alt=""`.

Expected: mark the icon decorative because adjacent text already conveys the message, or provide a meaningful accessible name if it is intended as informative content.

Coverage: `/welcome: passes automated WCAG A/AA checks`.

### WEB-006 - Sign-up footer link is distinguishable only by color

Priority: P2. axe rule: `link-in-text-block`.

On `/sign-up`, the inline `Sign In` link has no underline or equivalent non-color cue. axe measured link-to-surrounding-text contrast at 1.41:1, below the 3:1 threshold for a color-only distinction. Link color: `#381384`; surrounding text: `#494552`.

This finding concerns distinguishing a link from adjacent text, not text-to-background contrast.

Expected: a persistent non-color cue such as an underline, or an otherwise conforming link treatment. Nearby implementation: [FooterPrompt](../src/design-system/patterns/FooterPrompt.tsx).

Coverage: `/sign-up: passes automated WCAG A/AA checks`.

### WEB-007 - Four public screens expose no semantic heading

Priority: P2 accessibility/usability improvement; not reported here as an axe WCAG violation.

The visible headings on `/welcome`, `/sign-in`, `/sign-up`, and `/verify-email` are generic text in the accessibility tree. `/forgot-password` and the missing-token `/reset-password` state correctly expose headings.

Expected: screen titles participate in heading navigation for assistive technology.

Coverage: six `exposes a visible page heading` checks, with the two working pages serving as controls.

## Passing Checks

- All six public URLs returned HTTP 200 and rendered at 320px, 390px, and 1440px: 18 page/viewport combinations. No uncaught JavaScript errors, broken visible images, horizontal document overflow, or horizontally clipped form controls were observed in these checks.
- Signed-out direct navigation to `/home`, `/calendar`, `/chat`, `/memories`, `/timeline`, `/profile`, `/plans`, and `/setup` returned to `/welcome`.
- All four tested auth navigation links worked with pointer clicks.
- Empty submissions on sign-in, sign-up, and recovery displayed email validation without making API requests.
- Password reveal/hide preserved the value and switched the effective input type correctly on sign-in and sign-up. A missing `type` attribute correctly means plain text, not a product defect.
- `/reset-password` without a token displayed the invalid-link state; `Request a new link` navigated to a usable recovery form.
- Intercepted submit responses rendered an error and restored an enabled submit button.

## Observations Requiring Follow-Up

- One deliberately invalid login request to `https://destined-backend-rixf.onrender.com/v1/auth/login` timed out and displayed `No connection`. A later `/auth/me` request received HTTP 401. The terminal also encountered a corporate certificate-revocation-check failure. This is not sufficient evidence to label the backend down or blame CORS. Repeat from an unrestricted test runner before classifying it.
- axe marked some color-contrast checks incomplete. Automated results do not establish full contrast compliance, especially over gradients/illustrations.
- Google and Apple controls are explicitly disabled. Existing scope treats these integrations as deferred; they were not counted as newly discovered defects.
- Authenticated Chat, Memories, Plans, pairing, notifications, real email delivery, successful authentication, refresh persistence, and two-account synchronization remain unverified. No dedicated QA session was available.
- No production accounts, reset emails, pairing records, messages, payments, or deletions were created by this audit. Besides one invalid-login attempt, backend probing was limited to non-mutating requests. Successful form submissions were intercepted locally.

## Automation Added

- [Browser scenarios](../e2e/tests/public-flows.spec.mjs): public rendering, accessibility, title/heading semantics, narrow layouts, auth keyboard/pointer flows, validation, intercepted submission, password visibility, route guards, and reset recovery.
- [Playwright configuration](../e2e/playwright.config.mjs): desktop Chromium, Pixel 7 Chromium, iPhone 13 WebKit; one worker, no retries that could hide failures, failure screenshots/traces, HTML/JSON reports.
- [Isolated dependencies](../e2e/package.json): avoids installing the full Expo dependency tree to test an already-deployed site.
- [Manual CI workflow](../.github/workflows/live-e2e.yml): `Live browser regression tests`, configurable deployment URL, retained failure evidence for 14 days.
- Root command: `npm run test:e2e`.

All non-read network methods are blocked by default in these tests. Form tests override only their specific endpoint with a local error response; they never forward account creation or reset submissions. Service workers are blocked so they cannot bypass interception. Known defects are ordinary failing tests, not skipped tests or expected failures.

Run from the frontend repository on a machine with registry/browser-download access:

```powershell
npm --prefix e2e install --ignore-scripts --no-audit --no-fund
Push-Location e2e
npx playwright install chromium webkit
npm test
Pop-Location
```

For a preview deployment, set `E2E_BASE_URL` before running. Use `npm --prefix e2e run report` to open the HTML results after a run. The workflow must be available in the hosted repository before it can be dispatched; no commit, push, or remote workflow run was performed here.

## Verification Limits

The live interaction checks and axe scans above were executed through the integrated browser. Node syntax checks and JSON parsing passed for the added test/configuration files, and editor diagnostics found no new errors. The full local Playwright CLI run was not possible: npm returned `503 Service Unavailable` for `@playwright/test`, and the package was not cached. No dependency lockfile could be generated in this environment. The CI workflow and WebKit project have not been executed; their results must not be inferred from the Chromium probes.

The changes add tests and reporting only. None of the seven application defects has been fixed or deployed as part of this audit.