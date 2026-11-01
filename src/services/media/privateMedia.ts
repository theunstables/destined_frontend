import { API_URL } from '@/config/env'

export function privateMediaPath(uri: string | undefined): string | null {
  if (!uri || !API_URL) return null
  try {
    const target = new URL(uri)
    const api = new URL(API_URL)
    if (target.origin !== api.origin) return null
    const base = api.pathname.replace(/\/+$/, '')
    const path = target.pathname.slice(base.length)
    if (!target.pathname.startsWith(`${base}/`)) return null
    const match = /^\/(?:v1\/)?media\/([0-9a-f-]{36}\.[a-z0-9]+)$/i.exec(path)
    return match ? `/media/${match[1]}` : null
  } catch {
    return null
  }
}