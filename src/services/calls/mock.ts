import type { CallSignalingService } from '@/services/calls/types'

export function createMockCallSignalingService(): CallSignalingService {
  const listeners = new Set<Parameters<CallSignalingService['subscribe']>[0]>()
  return {
    subscribe(next) {
      listeners.add(next)
      return () => { listeners.delete(next) }
    },
    signal(callId, mode, action) {
      if (action === 'invite') {
        queueMicrotask(() => listeners.forEach((listener) =>
          listener({ callId, mode, action: 'accept', sentAt: Date.now() })))
      }
    },
  }
}
