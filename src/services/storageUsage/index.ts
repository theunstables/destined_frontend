import { isMockMode } from '@/config/env'
import { get } from '@/services/http/client'

export type StorageUsage = {
  totalBytes: number
  photoBytes: number
  videoBytes: number
  audioBytes: number
}

const empty: StorageUsage = { totalBytes: 0, photoBytes: 0, videoBytes: 0, audioBytes: 0 }

export const storageUsageService = {
  get: async (): Promise<StorageUsage> => isMockMode ? empty : get<StorageUsage>('/account/storage'),
}
