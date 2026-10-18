import { requireApiUrl } from '@/config/env'
import { get, put } from '@/services/http/client'
import { isApiError } from '@/services/http/errors'
import type {
  PreferencesResult,
  PreferencesService,
} from '@/services/preferences/types'
import type { Preferences } from '@/state/preferencesStore'

const ok = <T>(value: T): PreferencesResult<T> => ({ ok: true, value })

function fail(error: unknown): PreferencesResult<never> {
  if (isApiError(error)) {
    return {
      ok: false,
      error: {
        code: error.code === 'VALIDATION_ERROR' ? 'VALIDATION_ERROR' : error.code === 'NETWORK' ? 'NETWORK' : 'UNKNOWN',
      },
    }
  }
  return { ok: false, error: { code: 'UNKNOWN' } }
}

export function createHttpPreferencesService(): PreferencesService {
  requireApiUrl()

  return {
    async get() {
      try {
        return ok(await get<Preferences | null>('/preferences'))
      } catch (error) {
        return fail(error)
      }
    },

    async replace(preferences) {
      try {
        return ok(await put<Preferences>('/preferences', preferences))
      } catch (error) {
        return fail(error)
      }
    },
  }
}
