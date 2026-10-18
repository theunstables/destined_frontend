import { API_URL, WS_URL } from '@/config/env'
import { refreshSession } from '@/services/http/client'
import { getAccessToken, hydrate, isAccessTokenExpired } from '@/services/http/tokens'
import type { CallAction, CallMode, CallSignal, CallSignalingService } from '@/services/calls/types'

const socketUrl = () => WS_URL || `${API_URL.replace(/^http/i, 'ws')}/ws`

function parseSignal(value: unknown): CallSignal | null {
  if (!value || typeof value !== 'object') return null
  const event = value as Record<string, unknown>
  if (event.type !== 'call:signal' || typeof event.callId !== 'string') return null
  if (event.mode !== 'voice' && event.mode !== 'video') return null
  if (event.action !== 'invite' && event.action !== 'accept'
      && event.action !== 'decline' && event.action !== 'end') return null
  return {
    callId: event.callId,
    mode: event.mode,
    action: event.action,
    sentAt: typeof event.sentAt === 'number' ? event.sentAt : Date.now(),
    from: typeof event.from === 'string' ? event.from : undefined,
  }
}

export function createHttpCallSignalingService(): CallSignalingService {
  let socket: WebSocket | null = null
  const listeners = new Set<(signal: CallSignal) => void>()
  let stopped = false
  let retry: ReturnType<typeof setTimeout> | null = null
  const pending: Array<{ callId: string; mode: CallMode; action: CallAction }> = []

  const send = (frame: Record<string, unknown>) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(frame))
  }
  const flush = () => pending.splice(0).forEach((item) => send({ type: 'call:signal', ...item }))

  const connect = async () => {
    await hydrate()
    if (isAccessTokenExpired()) await refreshSession()
    const token = getAccessToken()
    if (!token || stopped) return
    const current = new WebSocket(`${socketUrl()}?token=${encodeURIComponent(token)}`)
    socket = current
    current.onopen = flush
    current.onmessage = (message) => {
      try {
        const signal = parseSignal(JSON.parse(String(message.data)))
        if (signal) listeners.forEach((listener) => listener(signal))
      } catch {
        // A malformed frame cannot invalidate the authenticated connection.
      }
    }
    current.onclose = () => {
      if (socket === current) socket = null
      if (!stopped) retry = setTimeout(() => { void connect() }, 1_500)
    }
  }

  return {
    subscribe(next) {
      listeners.add(next)
      stopped = false
      if (!socket) void connect()
      return () => {
        listeners.delete(next)
        if (listeners.size > 0) return
        stopped = true
        if (retry) clearTimeout(retry)
        socket?.close()
        socket = null
      }
    },
    signal(callId, mode, action) {
      const frame = { callId, mode, action }
      if (socket?.readyState === WebSocket.OPEN) send({ type: 'call:signal', ...frame })
      else pending.push(frame)
    },
  }
}
