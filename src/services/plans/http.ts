import { requireApiUrl } from '@/config/env'
import { get, put } from '@/services/http/client'
import { isApiError } from '@/services/http/errors'
import type {
  PlansErrorCode,
  PlansResult,
  PlansService,
  PlansSnapshot,
} from '@/services/plans/types'

const ok = <T>(value: T): PlansResult<T> => ({ ok: true, value })

function code(error: unknown): PlansErrorCode {
  if (!isApiError(error)) return 'UNKNOWN'
  if (error.code === 'NETWORK' || error.code === 'NO_COUPLE' || error.code === 'FORBIDDEN') {
    return error.code
  }
  return 'UNKNOWN'
}

export function createHttpPlansService(): PlansService {
  requireApiUrl()
  return {
    async get() {
      try {
        return ok(await get<PlansSnapshot | null>('/plans'))
      } catch (error) {
        return { ok: false, error: { code: code(error) } }
      }
    },
    async replace(state) {
      try {
        return ok(await put<PlansSnapshot>('/plans', state))
      } catch (error) {
        return { ok: false, error: { code: code(error) } }
      }
    },
  }
}
