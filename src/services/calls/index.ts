import { isMockMode } from '@/config/env'
import { createHttpCallSignalingService } from '@/services/calls/http'
import { createMockCallSignalingService } from '@/services/calls/mock'

export const callSignalingService = isMockMode
  ? createMockCallSignalingService()
  : createHttpCallSignalingService()

export type * from '@/services/calls/types'
