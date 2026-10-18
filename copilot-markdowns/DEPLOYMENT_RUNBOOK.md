# LoveOS deployment runbook

## Frontend

1. Use Node 20 LTS or newer and npm 10 or newer.
2. Install the lockfile exactly with `npm ci`.
3. Set `EXPO_PUBLIC_API_URL` to the public HTTPS API base URL without a trailing slash.
4. Set `EXPO_PUBLIC_WS_URL` to the public secure WebSocket endpoint when realtime chat is deployed; otherwise leave it empty.
5. Run `npm run typecheck`, `npm test`, and `npm run lint`.
6. Run `npm run build:web` for Vercel or `npm run predeploy` for static hosts requiring `404.html` and `.nojekyll`.
7. Smoke-test sign-in, pairing, home hydration, memory upload, chat, and account sign-out against the deployed API.

Both `EXPO_PUBLIC_*` values are compiled into the client and are public. Never place secrets in frontend environment variables.

An empty `EXPO_PUBLIC_API_URL` intentionally selects local mock mode. Production builds must provide it; otherwise sample providers are used and unsupported prototype capabilities become visible.

## Backend

Run the container with no Spring profile. The `pgdev` and `postgres` profiles contain development defaults and must never be enabled in production.

Required production values:

- `DATABASE_URL`, including `sslmode=require`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `JWT_SECRET`, at least 32 random characters
- `MAIL_DRIVER=smtp` plus SMTP credentials
- `PUBLIC_API_URL`
- `PUBLIC_APP_URL`
- `CORS_ORIGINS`, as an exact comma-separated HTTPS allow-list
- `MEDIA_DRIVER=s3` plus bucket/region/public-base configuration

Keep `JPA_DDL_AUTO=validate`. Flyway owns schema changes. For an existing pre-Flyway database, inspect the schema and backups before enabling `FLYWAY_BASELINE_ON_MIGRATE`; never enable it merely to bypass a failed migration.

Configure the hosting platform's liveness probe to `GET /health` and readiness probe to `GET /health/ready` on port 4000 (or `PORT`). The runtime image intentionally contains no extra HTTP client solely for a Dockerfile health check.

## Release order

1. Back up the database and review the immutable Flyway migration.
2. Deploy the backend and wait for readiness.
3. Verify `/health` and `/health/ready`.
4. Deploy the frontend with the final API and WebSocket URLs.
5. Complete the cross-device smoke test.
6. Monitor authentication failures, upload errors, WebSocket reconnects, and database pool saturation.

## Rollback

Application rollback is safe only while database changes remain backward-compatible. Prefer additive migrations. Do not edit or delete an applied Flyway migration; create a corrective migration instead.
