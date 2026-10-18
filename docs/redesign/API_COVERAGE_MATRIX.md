# API Coverage Matrix

**Rule:** A UI operation receives a Markdown contract before backend changes. Existing endpoints are reused when their behavior satisfies the contract.

| Product area | Existing backend surface | Coverage | Required action |
|---|---|---:|---|
| Authentication | `/v1/auth/signup`, login, refresh, logout, forgot/reset, verify/resend, me | Strong | Contract, HTTP adapter, public-request isolation, reset deep link, and backend tests exist. Complete secure refresh-token persistence, executable frontend validation, and visual parity; decide OAuth and signed-in credential changes separately. |
| Profile | `/v1/pairing/profile` GET/PUT, `/v1/media` | Strong | Onboarding and Personal Details use the same upload-first provider and synchronize authoritative profile fields. Phone verification remains unavailable without a contract. |
| Pairing | Profile read/save, invite create/cancel, redeem, confirm, space read/update, lifecycle | Strong | HTTP adapter, upload-first profile media, shared-space settings synchronization, polling/bootstrap, stable error mapping, and source tests exist. Complete executable frontend verification and physical two-client recovery; add endpoints only if a later deterministic guard proves a gap. |
| Story | `/v1/story` GET/PUT complete replacement | Strong | Preserve complete-replacement semantics and upload media first. |
| Home | `/v1/home` aggregate | Strong for implemented widgets | HTTP/mock provider and hydration drive greeting, days together, stats, upcoming dates, recent memories, and pulse; feature endpoints own mutations. Unsupported Song/Cycle/Partner Note remain contract-gated. |
| Calendar | CRUD, range, upcoming | Strong | HTTP/mock providers, add/edit routes, confirmed deletion, synchronized event/upcoming projections, Home/month views, occasion details, loading/error recovery, and source tests exist. Complete executable frontend verification. |
| Memories | CRUD, search, favorite, albums, private notes | Strong | Mock/HTTP providers, bounded pagination, PATCH-aligned edits, provider-backed album list/detail/create and membership add/remove flows, photo upload flow, and reciprocal private-note presentation exist. Video/voice memory attachments remain mock-only because the backend DTO does not accept them. Executable frontend verification remains blocked by unavailable local dependencies. |
| Timeline | `/v1/timeline` keyset projection | Strong | Mock/HTTP provider, global hydration, Home entry, typed feed, cursor paging, empty/error recovery, and source tests exist. Complete executable frontend and device verification. |
| Chat | HTTP messages/search/pinned/send/reactions/read/delete plus `/ws` | Strong | Mock and HTTP/WebSocket providers include reconnect, heartbeat, idempotent sends, deduplication, receipts, typing, reactions, pins, deletion, and memory interop. Complete executable two-client/device verification; voice/video moments remain non-functional shells. |
| Daily Question | GET today and PUT answer | Strong | HTTP/mock providers and Home states cover unanswered, partner-waiting, private waiting, complete reciprocal reveal, validation, and stable errors; executable frontend verification remains blocked. |
| Repair Signal | GET/POST/DELETE | Strong | HTTP/mock providers and Home states cover none, sent, received, mutual, error, and confirmed cancellation; executable frontend verification remains blocked. |
| Notifications | Preferences and device registration | Strong preferences, partial delivery | Settings now hydrates and persists the backend-supported preference subset with rollback/error handling. Device registration and actual provider delivery remain external requirements; unsupported device-only controls stay local. |
| Account | Export and deletion request/cancel/status | Strong | Mock/HTTP provider, hydrated deletion status, real 30-day scheduling, cancellation, and error-preserving UI states exist. Export delivery uses a JSON download on web and the native share sheet on devices; fabricated storage totals remain mock-only. Complete executable verification. |
| Media | Multipart upload and public media read | Strong | Add provider, progress/error/permission behavior, and upload sequencing. |
| Plans | None | Missing | Write contracts by subfeature, then add Spring modules and Flyway migrations incrementally. |
| Song | None | Missing | Decide metadata ownership and playback model before contract/schema. |
| Period tracking | None | Missing | Write privacy-first contract; user-owned records and explicit revocable sharing are mandatory. |
| Partner note | No dedicated endpoint | Undecided | Decide whether this is a chat message presentation or a dedicated durable note resource. |
| Compatibility | No endpoint | Undecided | Prefer deterministic derived presentation unless persisted inputs/results are required. |
| Phone verification | None identified | Missing | Classify as real external integration or explicitly disabled/informational. |
| Billing | None identified | Missing | Do not present as functional until product/provider contract exists. |
| Feedback | None identified | Missing | Define local mail/external support behavior or API contract. |

## Standard backend envelope

Successful responses use the backend `ApiResponse` envelope. Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "issues": [
      { "field": "email", "message": "Must be a valid email" }
    ]
  },
  "requestId": "request-id"
}
```

Frontend adapters must preserve stable error codes, field issues, and `requestId`. Screens map codes to copy from `src/copy`; they must not display raw server exceptions.

## Contract template

Each `contracts/*.md` document contains:

1. Purpose and owning screens.
2. State model.
3. Authentication and authorization.
4. Endpoint table.
5. Request and response examples.
6. Validation and normalization.
7. Stable error codes and UI mapping.
8. Idempotency and concurrency.
9. Privacy, retention, and ownership.
10. Pagination, media, or realtime behavior.
11. Existing-backend mapping and identified gaps.
12. Frontend and backend test obligations.
