# Private GitHub Media Storage

## How Images Reach the UI

The UI must not use a private GitHub raw URL or receive the GitHub PAT.

```text
Upload: UI -- app authentication + file --> backend -- server PAT --> private GitHub repo
Read:   UI -- app bearer token + image key --> backend -- ownership check + server PAT --> GitHub
        UI <-- image bytes and image Content-Type <-- backend
```

The upload response still contains `{ url, contentType, bytes }`. For GitHub storage, `url` is a backend address shaped like:

```text
https://destined-backend-rixf.onrender.com/v1/media/<generated-key>.png
```

The shared private-image loader requests these URLs through the app's authenticated HTTP client. On web it displays a temporary browser object URL; on native it loads the authenticated bytes into a local data URI. Public decorative assets remain unchanged. The backend checks the current couple against the persisted media owner before fetching bytes. It does not redirect to GitHub or return GitHub's temporary `download_url`.

## Privacy Model

- Image URLs are no longer bearer credentials. Both `/media/{key}` and `/v1/media/{key}` require app authentication and a matching current couple ownership record. Anonymous requests return 401; a different couple or unknown owner record is denied before storage access.
- The PAT stays in backend environment variables. The app's own short-lived access token is used for authenticated image requests, never placed in image URLs, and never sent to foreign image hosts.
- Old `signature` query parameters do not authorize reads. `MEDIA_GITHUB_SIGNING_KEY` is no longer used and can be removed after deploying the strict version.
- The adapter checks that the repository is private before each upload/read. If it is made public, the adapter refuses further operations, but that cannot undo exposure of the repository itself.
- Responses use `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, inline image content, and no redirect. These headers do not prevent users from saving or sharing a picture they can view.
- Browser object URLs are revoked when their image unmounts or the user/partner context changes. This does not stop an authorized viewer from saving or screenshotting an image. App access tokens retain the existing JWT lifetime; logout does not retroactively erase already downloaded bytes.
- Deleting a memory record does not purge its uploaded file or Git history. Per-image revocation, automatic file deletion, and historical data erasure are not implemented. A private repository is not end-to-end encryption.

## Create the Repository and Token

1. Create a separate **private** repository for media, for example `talesoftwo-media`. Do not use the application source repository. Initialize it with a README so its target branch exists.
2. Create a fine-grained personal access token owned by the appropriate user/organization, limited to this one repository. Grant repository **Contents: Read and write**; metadata read access is also needed for the private-repository check. Grant no workflow or administration permissions.
3. If your organization requires token approval/SSO authorization, complete that through its normal process. Do not bypass organizational policy.
4. Set a suitable token expiry and plan to renew it. Enter the token directly into Render; never paste it into chat, source files, screenshots, or frontend `EXPO_PUBLIC_*` settings.

Uploads create commits through GitHub's Contents API under `uploads/<first-two-key-characters>/<generated-key>`. The adapter serializes writes within one backend instance and never modifies workflow or source files. Keep the repository/branch dedicated to this purpose and ensure its rules permit the token's uploads. Concurrent writers in other processes can still conflict.

## Render Backend Settings

```dotenv
MEDIA_DRIVER=github
MEDIA_GITHUB_OWNER=<GitHub user or organization>
MEDIA_GITHUB_REPOSITORY=talesoftwo-media
MEDIA_GITHUB_BRANCH=main
MEDIA_GITHUB_TOKEN=<fine-grained PAT entered privately>
MEDIA_MAX_BYTES=8388608
PUBLIC_API_URL=https://destined-backend-rixf.onrender.com
```

Use actual values without angle-bracket placeholders. The example upload limit is 8 MiB; this implementation permits a configured maximum up to 25 MiB. Larger uploads are not sent. Missing owner/repository/token/branch prevents the GitHub adapter from starting.

Deploy the updated backend before enabling this setting. Rebuild/deploy the updated frontend too: its web uploader now appends an actual Blob/File to FormData instead of the React Native `{ uri, name, type }` object. Native upload behavior is preserved.

The strict version adds V13, `media_assets`, to persist couple ownership and storage driver. It deliberately does not guess ownership of old URLs. Existing files without a verified row must be re-uploaded or migrated using trusted ownership evidence; otherwise reads fail closed. Switching storage drivers does not copy files or update owner rows. Keep backups and plan this before rollout. Existing externally public S3 URLs remain public until that bucket/URL access is removed; backend authorization cannot revoke an external public link.

## Verification After Deployment

1. Upload one small test picture from the app using a paired QA account.
2. Confirm a file/commit appears in the private media repository, an ownership row exists, and the app stores a backend URL without a PAT or signature.
3. Open the image in the app on a second QA device. No GitHub login or PAT should be required in the client.
4. Open the backend URL without app authentication: expect 401. Request it with a different couple's session: expect denial. The owner's partner should be able to load it from the app.
5. Redeploy the backend with the same repository, branch, database, and public backend URL. The stored image should still load because ownership remains in PostgreSQL and bytes remain in GitHub.
6. Check PAT expiry and GitHub API/storage quotas. A GitHub outage/rate limit or a cold Render backend can still make image reads fail or appear slow.

The repository is not unlimited storage or an image CDN. Each image read performs a private-repository check and a raw-file request; uploads also consume API calls and create Git history. There is no persistent cache or Git LFS integration in this adapter. Use this as the explicitly chosen temporary, low-volume setup and plan a durable object-storage migration as usage grows.

## Implementation and Tests

- [GitHubStorageProvider](../../destined_backend/src/main/java/com/loveos/api/media/GitHubStorageProvider.java): authenticated, private-only GitHub storage.
- [MediaController](../../destined_backend/src/main/java/com/loveos/api/media/MediaController.java): image-byte responses, not GitHub redirects.
- [Private image loader](../src/design-system/primitives/PrivateImage.tsx): authenticated backend image loading with no credentials sent to external assets.
- [Backend tests](../../destined_backend/src/test/java/com/loveos/api/media/GitHubStorageProviderTest.java): private uploads/raw reads, public-repo refusal, error redaction, and a decodable PNG response for an authenticated owner without a client PAT.

The strict backend has been tested for anonymous rejection, same-couple access, other-couple denial, and ownership persistence during upload; real PostgreSQL migration/startup checks also passed. GitHub responses were mocked: no PAT was used, no real repository was accessed, and no images were pushed. A real private-repository/browser deployment test remains pending your configuration. Full frontend Jest/Expo testing remains blocked by the previously documented missing dependencies.