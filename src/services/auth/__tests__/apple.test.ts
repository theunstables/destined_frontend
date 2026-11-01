import * as WebBrowser from 'expo-web-browser'
import { postPublic } from '@/services/http/client'
import { setTokens } from '@/services/http/tokens'
import { appleSignIn, validateAppleReturn } from '@/services/auth/apple'

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }))
jest.mock('@/services/http/client', () => ({ post: jest.fn(), postPublic: jest.fn(), request: jest.fn() }))
jest.mock('@/services/http/tokens', () => ({ setTokens: jest.fn() }))
jest.mock('@/services/auth/session', () => ({ setCachedSession: jest.fn() }))
jest.mock('@/state/sessionStore', () => ({ useSessionStore: { getState: () => ({ session: null }) } }))

const start = { authorizationUrl: 'https://appleid.apple.com/auth/authorize', state: 'expected', exchangeSecret: 'client-only-secret', redirectUrl: 'talesoftwo://apple-callback' }

beforeEach(() => jest.resetAllMocks())

it('validates callback origin, path, and state', () => {
  const target = 'https://www.example.test/apple-callback'
  expect(validateAppleReturn(`${target}?state=expected`, target, 'expected').pathname).toBe('/apple-callback')
  expect(() => validateAppleReturn('https://evil.test/apple-callback?state=expected', target, 'expected')).toThrow()
  expect(() => validateAppleReturn(`${target}?state=wrong`, target, 'expected')).toThrow()
})

it('exchanges the one-time handoff without putting app tokens in the URL', async () => {
  const session = { user: { userId: 'qa-user', email: 'qa@privaterelay.appleid.com', emailVerified: true }, accessToken: 'app-access', refreshToken: 'app-refresh', expiresIn: 900 }
  jest.mocked(postPublic).mockResolvedValueOnce(start).mockResolvedValueOnce(session)
  jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({ type: 'success', url: 'talesoftwo://apple-callback?state=expected&ticket=one-time' })
  expect(await appleSignIn()).toEqual(session.user)
  expect(postPublic).toHaveBeenLastCalledWith('/auth/apple/exchange', { ticket: 'one-time', exchangeSecret: 'client-only-secret' })
  expect(setTokens).toHaveBeenCalledWith(session)
})

it('cancellation never issues an app session', async () => {
  jest.mocked(postPublic).mockResolvedValueOnce(start)
  jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({ type: 'cancel' } as WebBrowser.WebBrowserAuthSessionResult)
  expect(await appleSignIn()).toBeNull()
  expect(postPublic).toHaveBeenCalledTimes(1)
  expect(setTokens).not.toHaveBeenCalled()
})

it('rejects a callback from a different login attempt', async () => {
  jest.mocked(postPublic).mockResolvedValueOnce(start)
  jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({ type: 'success', url: 'talesoftwo://apple-callback?state=wrong&ticket=one-time' })
  await expect(appleSignIn()).rejects.toThrow('invalid sign-in response')
  expect(postPublic).toHaveBeenCalledTimes(1)
  expect(setTokens).not.toHaveBeenCalled()
})