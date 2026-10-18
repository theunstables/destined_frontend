import { isMockMode } from '@/config/env'
import { createHttpSharedPlacesService } from '@/services/sharedPlaces/http'
import { createMockSharedPlacesService } from '@/services/sharedPlaces/mock'

export const sharedPlacesService = isMockMode
  ? createMockSharedPlacesService()
  : createHttpSharedPlacesService()

export type * from '@/services/sharedPlaces/types'
