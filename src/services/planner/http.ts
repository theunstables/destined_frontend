import { requireApiUrl } from '@/config/env'
import { get, post } from '@/services/http/client'
import { isApiError } from '@/services/http/errors'
import type {
  PlannerErrorCode,
  PlannerService,
  PlannerStage,
  Result,
} from '@/services/planner/types'
import type { Trip } from '@/services/plans/types'

const STAGES: PlannerStage[] = [
  { key: 'reading', detail: 'Reading the preferences you chose.' },
  { key: 'searching', detail: 'Finding a balanced set of moments.' },
  { key: 'routing', detail: 'Putting each day in a comfortable order.' },
  { key: 'budgeting', detail: 'Checking the plan against your budget.' },
  { key: 'writing', detail: 'Writing the finished itinerary.' },
]

function errorCode(error: unknown): PlannerErrorCode {
  if (!isApiError(error)) return 'UNKNOWN'
  if (error.code === 'NETWORK') return 'NETWORK'
  if (error.code === 'VALIDATION_ERROR') return 'NO_PLAN_FOUND'
  return 'UNKNOWN'
}

const fail = (error: unknown): Result<never> => ({
  ok: false,
  error: { code: errorCode(error) },
})

export function createHttpPlannerService(): PlannerService {
  requireApiUrl()

  return {
    maxNights: 14,

    async destinations() {
      try {
        return {
          ok: true,
          value: await get<{ name: string; tagline: string }[]>('/planner/destinations'),
        }
      } catch (error) {
        return fail(error)
      }
    },

    async generate({ draft, onProgress }) {
      try {
        STAGES.slice(0, -1).forEach((stage, index) => onProgress?.(stage, index, STAGES.length))
        const trip = await post<Trip>('/planner/generate', draft)
        onProgress?.(STAGES.at(-1)!, STAGES.length - 1, STAGES.length)
        return { ok: true, value: trip }
      } catch (error) {
        return fail(error)
      }
    },
  }
}
