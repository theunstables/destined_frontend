export type CallMode = 'voice' | 'video'
export type CallAction = 'invite' | 'accept' | 'decline' | 'end'

export type CallSignal = {
  callId: string
  mode: CallMode
  action: CallAction
  sentAt: number
  /** Authenticated sender UUID on server-relayed frames; absent in local mock events. */
  from?: string
}

export type CallSignalingService = {
  subscribe: (listener: (signal: CallSignal) => void) => () => void
  signal: (callId: string, mode: CallMode, action: CallAction) => void
}
