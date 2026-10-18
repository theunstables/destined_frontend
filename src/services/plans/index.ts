import { isMockMode } from '@/config/env'
import { createHttpPlansService } from '@/services/plans/http'
import { createMockPlansService } from '@/services/plans/mock'

export type * from '@/services/plans/types'

export const plansService = isMockMode ? createMockPlansService() : createHttpPlansService()
