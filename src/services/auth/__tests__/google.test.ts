import * as WebBrowser from 'expo-web-browser'
import { postPublic } from '@/services/http/client'
import { setTokens } from '@/services/http/tokens'
import { googleSignIn, validateGoogleReturn } from '@/services/auth/google'

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }))
jest.mock('@/services/http/client', () => ({ post: jest.fn(), postPublic: jest.fn(), request: jest.fn() }))
jest.mock('@/services/http/tokens', () => ({ setTokens: jest.fn() }))
jest.mock('@/services/auth/session', () => ({ setCachedSession: jest.fn() }))
jest.mock('@/state/sessionStore', () => ({ useSessionStore: { getState: () => ({ session: null }) } }))

const start = { authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth', state: 'expected', exchangeSecret: 'client-only-secret', redirectUrl: 'talesoftwo://google-callback' }

beforeEach(() => jest.resetAllMocks())

it('validates the exact callback origin, path and state', () => {
  const target = 'https://www.example.test/google-callback'
  expect(validateGoogleReturn(`${target}?state=expected`, target, 'expected').pathname).toBe('/google-callback')
  expect(() => validateGoogleReturn('https://evil.test/google-callback?state=expected', target, 'expected')).toThrow()
  expect(() => validateGoogleReturn(`${target}?state=wrong`, target, 'expected')).toThrow()
})

it('exchanges the one-time ticket and keeps app tokens out of the callback URL', async () => {
  const session = { user: { userId: 'qa-user', email: 'qa@example.test', emailVerified: true }, accessToken: 'app-access', refreshToken: 'app-refresh', expiresIn: 900 }
  jest.mocked(postPublic).mockResolvedValueOnce(start).mockResolvedValueOnce(session)
  jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({ type: 'success', url: 'talesoftwo://google-callback?state=expected&ticket=one-time' })
  expect(await googleSignIn()).toEqual(session.user)
  expect(postPublic).toHaveBeenLastCalledWith('/auth/google/exchange', { ticket: 'one-time', exchangeSecret: 'client-only-secret' })
  expect(setTokens).toHaveBeenCalledWith(session)
})

it('cancellation does not exchange a ticket or create a session', async () => {
  jest.mocked(postPublic).mockResolvedValueOnce(start)
  jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({ type: 'cancel' } as WebBrowser.WebBrowserAuthSessionResult)
  expect(await googleSignIn()).toBeNull()
  expect(postPublic).toHaveBeenCalledTimes(1)
  expect(setTokens).not.toHaveBeenCalled()
})

it('rejects a callback with a different state before exchanging anything', async () => {
  jest.mocked(postPublic).mockResolvedValueOnce(start)
  jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({ type: 'success', url: 'talesoftwo://google-callback?state=wrong&ticket=one-time' })
  await expect(googleSignIn()).rejects.toThrow('invalid sign-in response')
  expect(postPublic).toHaveBeenCalledTimes(1)
  expect(setTokens).not.toHaveBeenCalled()
})