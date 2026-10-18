import type { Preferences } from '@/state/preferencesStore'

export type PreferencesErrorCode = 'NETWORK' | 'VALIDATION_ERROR' | 'UNKNOWN'
export type PreferencesResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: PreferencesErrorCode } }

export type PreferencesService = {
  get: () => Promise<PreferencesResult<Preferences | null>>
  replace: (preferences: Preferences) => Promise<PreferencesResult<Preferences>>
}
