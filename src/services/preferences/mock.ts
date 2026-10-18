import type { PreferencesService } from '@/services/preferences/types'
import type { Preferences } from '@/state/preferencesStore'

export function createMockPreferencesService(): PreferencesService {
  let saved: Preferences | null = null

  return {
    async get() {
      return { ok: true, value: saved ? { ...saved } : null }
    },
    async replace(preferences) {
      saved = { ...preferences, homeCards: [...preferences.homeCards] }
      return { ok: true, value: { ...saved, homeCards: [...saved.homeCards] } }
    },
  }
}
