import { isMockMode } from '@/config/env'
import { createHttpPreferencesService } from '@/services/preferences/http'
import { createMockPreferencesService } from '@/services/preferences/mock'

export const preferencesService = isMockMode
  ? createMockPreferencesService()
  : createHttpPreferencesService()
