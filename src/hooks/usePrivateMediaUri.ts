import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { request } from '@/services/http/client'
import { privateMediaPath } from '@/services/media/privateMedia'
import { useSessionStore } from '@/state/sessionStore'
import { useRelationshipStore } from '@/state/relationshipStore'

export function usePrivateMediaUri(uri: string | undefined): string | undefined {
  const userId = useSessionStore((state) => state.session?.userId)
  const relationshipStatus = useRelationshipStore((state) => state.status)
  const partnerId = useRelationshipStore((state) => state.partner?.id)
  const path = privateMediaPath(uri)
  const identity = `${userId ?? ''}:${partnerId ?? ''}:${relationshipStatus}:${uri ?? ''}`
  const [resolved, setResolved] = useState<{ identity: string; uri: string } | null>(null)

  useEffect(() => {
    if (!path || !userId) return
    const controller = new AbortController()
    let active = true
    let objectUrl: string | undefined
    void request<Blob>(path, { responseType: 'blob', signal: controller.signal, timeoutMs: 60_000 })
      .then(async ({ data }) => {
        if (!active) return
        let result: string
        if (Platform.OS === 'web') {
          objectUrl = URL.createObjectURL(data)
          result = objectUrl
        } else {
          result = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(new Error('Media could not be decoded'))
            reader.readAsDataURL(data)
          })
        }
        if (active) setResolved({ identity, uri: result })
      }).catch(() => { if (active) setResolved(null) })
    return () => {
      active = false
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [identity, path, userId])

  if (!path) return uri
  return userId && resolved?.identity === identity ? resolved.uri : undefined
}