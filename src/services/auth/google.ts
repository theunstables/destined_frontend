import { Platform } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { post, postPublic, request } from '@/services/http/client'
import { setTokens } from '@/services/http/tokens'
import { setCachedSession } from '@/services/auth/session'
import { useSessionStore } from '@/state/sessionStore'
import type { Session } from '@/services/auth/types'

type Start = { authorizationUrl: string; state: string; exchangeSecret: string; redirectUrl: string }
type SessionResponse = { user: Session; accessToken: string; refreshToken: string; expiresIn: number }
const WINDOW_NAME = 'talesoftwo-google-auth'
let inProgress = false

export async function googleEnabled(): Promise<boolean> {
  return (await request<{ enabled: boolean }>('/auth/google/config', { authenticated: false })).data.enabled
}

export function googleFlowActive(): boolean { return inProgress }

export function validateGoogleReturn(returned: string, expected: string, state: string): URL {
  const url = new URL(returned)
  const target = new URL(expected)
  if (url.protocol !== target.protocol || url.host !== target.host || url.pathname !== target.pathname
    || url.searchParams.get('state') !== state) throw new Error('Google returned an invalid sign-in response. Please try again.')
  return url
}

export async function googleSignIn(link = false): Promise<Session | null> {
  if (inProgress) return null
  inProgress = true
  const originalUser = useSessionStore.getState().session?.userId
  let reserved: Window | null = null
  try {
    if (Platform.OS === 'web') {
      reserved = window.open('about:blank', WINDOW_NAME, 'width=520,height=720')
      if (!reserved) throw new Error('Allow the Google sign-in popup and try again.')
    }
    const start = await (link ? post<Start> : postPublic<Start>)('/auth/google/start', {
      platform: Platform.OS === 'web' ? 'web' : 'native', link,
    })
    if (new URL(start.authorizationUrl).origin !== 'https://accounts.google.com') throw new Error('Google sign-in is unavailable.')
    if (Platform.OS === 'web' && new URL(start.redirectUrl).origin !== window.location.origin) {
      throw new Error('Google sign-in is not configured for this website address.')
    }
    if (reserved?.closed) return null
    const result = await WebBrowser.openAuthSessionAsync(start.authorizationUrl, start.redirectUrl, {
      windowName: WINDOW_NAME, windowFeatures: 'width=520,height=720', preferEphemeralSession: true,
    })
    if (result.type !== 'success') return null
    const returned = validateGoogleReturn(result.url, start.redirectUrl, start.state)
    if (returned.searchParams.get('error') === 'cancelled') return null
    if (returned.searchParams.has('error')) throw new Error('Google could not complete sign-in. Please try again.')
    const ticket = returned.searchParams.get('ticket')
    if (!ticket) throw new Error('Google sign-in did not return a valid result.')
    if (useSessionStore.getState().session?.userId !== originalUser) throw new Error('Your app session changed. Please try again.')
    const session = await postPublic<SessionResponse>('/auth/google/exchange', { ticket, exchangeSecret: start.exchangeSecret })
    if (useSessionStore.getState().session?.userId !== originalUser || (link && session.user.userId !== originalUser)) {
      throw new Error('Your app session changed. Please try again.')
    }
    await setTokens(session)
    setCachedSession(session.user)
    return session.user
  } finally {
    reserved?.close()
    inProgress = false
  }
}