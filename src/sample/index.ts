import { isMockMode } from '@/config/env'

/**
 * SAMPLE CONTENT — the UI's stand-in until a backend exists.
 *
 * Imported by screens only. Nothing under `services/` or `state/` reads from
 * here, so deleting this directory is a UI-layer change and never a data-layer
 * one.
 */
export { SAMPLE_MEMORIES } from '@/sample/memories'
export { SAMPLE_ALBUMS, findAlbum, memoriesInAlbum, type Album } from '@/sample/albums'
export { SAMPLE_HOME } from '@/sample/home'

/**
 * THE SWITCH.
 *
 * Sample records are a mock-mode preview only. API-backed builds must show the
 * genuine empty or not-found state; substituting an invented record after a
 * server miss would misrepresent the couple's private data.
 */
export const USE_SAMPLE_CONTENT = isMockMode
