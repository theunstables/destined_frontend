/**
 * Product capabilities that differ between the local preview and API-backed app.
 *
 * Keep this list explicit. A screen must not infer backend support from a route,
 * sample record, or locally available device API: those can make an action look
 * durable even when no server contract exists for it.
 */
export const capabilities = {
  /** Plans uses local previews in mock mode and durable couple state in API mode. */
  plans: true,
  /** Memory video attachments are uploaded and stored by the API. */
  memoryVideoAttachments: true,
  /** Memory voice attachments are uploaded and stored by the API. */
  memoryVoiceAttachments: true,
  /** User privacy and chat-behaviour preferences persist through the API. */
  serverPreferences: true,
  /** Couple-scoped Watch Together presence, playback, reactions, and whispers use WebSocket. */
  watchTogetherRealtime: true,
  /** The API stores only each member's current expiring location fix. */
  ephemeralSharedPlaces: true,
  /** Browser capture works; native capture awaits the unavailable expo-location install. */
  nativeLocationCapture: false,
} as const

export type Capability = keyof typeof capabilities

export function hasCapability(capability: Capability): boolean {
  return capabilities[capability]
}
