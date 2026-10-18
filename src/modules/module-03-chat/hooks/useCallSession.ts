import { useEffect, useState } from 'react'

import { callSignalingService, type CallMode } from '@/services/calls'

export type CallState = 'calling' | 'connected' | 'declined' | 'ended'

export function useCallSession(callId: string, mode: CallMode, incoming = false) {
  const [state, setState] = useState<CallState>('calling')

  useEffect(() => {
    const unsubscribe = callSignalingService.subscribe((signal) => {
      if (signal.callId !== callId || signal.mode !== mode) return
      if (signal.action === 'accept') setState('connected')
      if (signal.action === 'decline') setState('declined')
      if (signal.action === 'end') setState('ended')
    })
    callSignalingService.signal(callId, mode, incoming ? 'accept' : 'invite')
    if (incoming) setState('connected')
    return () => unsubscribe()
  }, [callId, incoming, mode])

  const end = () => {
    callSignalingService.signal(callId, mode, 'end')
    setState('ended')
  }

  return { state, end }
}
