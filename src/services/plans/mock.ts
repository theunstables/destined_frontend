import type { PlansService, PlansSnapshot } from '@/services/plans/types'

export function createMockPlansService(): PlansService {
  let state: PlansSnapshot | null = null
  return {
    async get() {
      return { ok: true, value: state ? structuredClone(state) : null }
    },
    async replace(next) {
      state = structuredClone(next)
      return { ok: true, value: structuredClone(state) }
    },
  }
}
