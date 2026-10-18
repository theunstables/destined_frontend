import { isMockMode } from '@/config/env'
import { createHttpWatchTogetherService } from '@/services/watchTogether/http'
import { createMockWatchTogetherService } from '@/services/watchTogether/mock'

export const watchTogetherService = isMockMode
  ? createMockWatchTogetherService()
  : createHttpWatchTogetherService()

export type * from '@/services/watchTogether/types'
