import { API_URL, WS_URL } from '@/config/env'
import { refreshSession } from '@/services/http/client'
import { getAccessToken, hydrate, isAccessTokenExpired } from '@/services/http/tokens'
import type { WatchRealtimeEvent, WatchTogetherService } from '@/services/watchTogether/types'

const socketUrl = () => WS_URL || `${API_URL.replace(/^http/i, 'ws')}/ws`

function readEvent(value: unknown): WatchRealtimeEvent | null {
  if (!value || typeof value !== 'object') return null
  const event = value as Record<string, unknown>
  if (event.type === 'watch:presence' && typeof event.connected === 'boolean') {
    return { type: 'presence', connected: event.connected }
  }
  if (event.type === 'watch:playback'
      && (event.action === 'play' || event.action === 'pause' || event.action === 'seek')
      && typeof event.positionSeconds === 'number') {
    return {
      type: 'playback', action: event.action,
      positionSeconds: event.positionSeconds,
      sentAt: typeof event.sentAt === 'number' ? event.sentAt : Date.now(),
    }
  }
  if (event.type === 'watch:whisper' && typeof event.id === 'string'
      && typeof event.text === 'string' && typeof event.positionSeconds === 'number') {
    return { type: 'whisper', id: event.id, text: event.text, positionSeconds: event.positionSeconds }
  }
  if (event.type === 'watch:reaction' && typeof event.emoji === 'string') {
    return { type: 'reaction', emoji: event.emoji }
  }
  return null
}

export function createHttpWatchTogetherService(): WatchTogetherService {
  let socket: WebSocket | null = null
  let listener: ((event: WatchRealtimeEvent) => void) | null = null
  let stopped = false
  let retry: ReturnType<typeof setTimeout> | null = null

  const send = (frame: Record<string, unknown>) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(frame))
  }

  const connect = async () => {
    await hydrate()
    if (isAccessTokenExpired()) await refreshSession()
    const token = getAccessToken()
    if (!token || stopped) return
    const current = new WebSocket(`${socketUrl()}?token=${encodeURIComponent(token)}`)
    socket = current
    current.onopen = () => send({ type: 'watch:join' })
    current.onmessage = (message) => {
      try {
        const event = readEvent(JSON.parse(String(message.data)))
        if (event) listener?.(event)
      } catch {
        // Ignore malformed frames without dropping an otherwise healthy session.
      }
    }
    current.onclose = () => {
      if (socket === current) socket = null
      if (!stopped) retry = setTimeout(() => { void connect() }, 1_500)
    }
  }

  return {
    subscribe(next) {
      listener = next
      stopped = false
      void connect()
      return () => {
        stopped = true
        listener = null
        if (retry) clearTimeout(retry)
        send({ type: 'watch:leave' })
        socket?.close()
        socket = null
      }
    },
    playback(action, positionSeconds) {
      send({ type: 'watch:playback', action, positionSeconds })
    },
    whisper(text, positionSeconds) {
      send({ type: 'watch:whisper', text, positionSeconds })
    },
    react(emoji) {
      send({ type: 'watch:reaction', emoji })
    },
  }
}
