import type { WatchTogetherService } from '@/services/watchTogether/types'

export function createMockWatchTogetherService(): WatchTogetherService {
  return {
    subscribe(listener) {
      listener({ type: 'presence', connected: true })
      return () => undefined
    },
    playback() {},
    whisper() {},
    react() {},
  }
}
