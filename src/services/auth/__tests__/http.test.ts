import { createHttpAuthService } from '@/services/auth/http'
import { get, postPublic } from '@/services/http/client'
import { ApiError } from '@/services/http/errors'
import { clearTokens, getRefreshToken, setTokens } from '@/services/http/tokens'
import { setCachedSession } from '@/services/auth/session'

jest.mock('@/config/env', () => ({ requireApiUrl: jest.fn(() => 'http://localhost:4000/v1') }))
jest.mock('@/services/http/client', () => ({ get: jest.fn(), postPublic: jest.fn() }))
jest.mock('@/services/http/tokens', () => ({
  clearTokens: jest.fn(),
  getRefreshToken: jest.fn(),
  setTokens: jest.fn(),
}))
jest.mock('@/services/auth/session', () => ({ setCachedSession: jest.fn() }))

const mockGet = jest.mocked(get)
const mockPostPublic = jest.mocked(postPublic)
const mockClearTokens = jest.mocked(clearTokens)
const mockGetRefreshToken = jest.mocked(getRefreshToken)
const mockSetTokens = jest.mocked(setTokens)
const mockSetCachedSession = jest.mocked(setCachedSession)

const user = {
  userId: 'user-1',
  email: 'olivia@example.com',
  emailVerified: false,
}

const sessionResponse = {
  user,
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 900,
}

describe('HTTP auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('stores tokens below the screen layer after sign up', async () => {
    mockPostPublic.mockResolvedValueOnce(sessionResponse)
    const service = createHttpAuthService()

    const result = await service.signUp({
      email: 'olivia@example.com',
      password: 'Password1!',
    })

    expect(mockPostPublic).toHaveBeenCalledWith('/auth/signup', {
      email: 'olivia@example.com',
      password: 'Password1!',
    })
    expect(mockSetTokens).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
    })
    expect(mockSetCachedSession).toHaveBeenCalledWith(user)
    expect(result).toEqual({ ok: true, value: user })
  })

  it('uses the public login operation and stores its returned session', async () => {
    mockPostPublic.mockResolvedValueOnce(sessionResponse)
    const service = createHttpAuthService()

    const result = await service.signIn({
      email: 'olivia@example.com',
      password: 'Password1!',
    })

    expect(mockPostPublic).toHaveBeenCalledWith('/auth/login', {
      email: 'olivia@example.com',
      password: 'Password1!',
    })
    expect(mockSetTokens).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
    })
    expect(mockSetCachedSession).toHaveBeenCalledWith(user)
    expect(result).toEqual({ ok: true, value: user })
  })

  it('reads the current verification state from /auth/me', async () => {
    const verified = { ...user, emailVerified: true }
    mockGet.mockResolvedValueOnce({ user: verified })
    const service = createHttpAuthService()

    const result = await service.getCurrentSession()

    expect(mockGet).toHaveBeenCalledWith('/auth/me')
    expect(mockSetCachedSession).toHaveBeenCalledWith(verified)
    expect(result).toEqual({ ok: true, value: verified })
  })

  it('clears revoked local credentials only after a successful password reset', async () => {
    mockPostPublic.mockResolvedValueOnce({ reset: true })
    const service = createHttpAuthService()

    const result = await service.resetPassword({ token: 'reset-token', newPassword: 'Password1!' })

    expect(mockPostPublic).toHaveBeenCalledWith('/auth/password/reset', {
      token: 'reset-token',
      newPassword: 'Password1!',
    })
    expect(mockClearTokens).toHaveBeenCalledTimes(1)
    expect(mockSetCachedSession).toHaveBeenCalledWith(null)
    expect(result).toEqual({ ok: true, value: null })
  })

  it('requests password recovery through the public anti-enumeration endpoint', async () => {
    mockPostPublic.mockResolvedValueOnce({ accepted: true })
    const service = createHttpAuthService()

    const result = await service.requestPasswordReset({ email: 'olivia@example.com' })

    expect(mockPostPublic).toHaveBeenCalledWith('/auth/password/forgot', {
      email: 'olivia@example.com',
    })
    expect(result).toEqual({ ok: true, value: null })
  })

  it('resends verification through the public endpoint', async () => {
    mockPostPublic.mockResolvedValueOnce({ accepted: true })
    const service = createHttpAuthService()

    const result = await service.resendVerification({ email: 'olivia@example.com' })

    expect(mockPostPublic).toHaveBeenCalledWith('/auth/verify-email/resend', {
      email: 'olivia@example.com',
    })
    expect(result).toEqual({ ok: true, value: null })
  })

  it('always clears local credentials when server logout fails', async () => {
    mockGetRefreshToken.mockReturnValue('refresh-token')
    mockPostPublic.mockRejectedValueOnce(new Error('offline'))
    const service = createHttpAuthService()

    await service.signOut()

    expect(mockPostPublic).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh-token' })
    expect(mockClearTokens).toHaveBeenCalledTimes(1)
    expect(mockSetCachedSession).toHaveBeenCalledWith(null)
  })

  it('maps stable server errors without storing a failed sign-in', async () => {
    mockPostPublic.mockRejectedValueOnce(
      new ApiError('INVALID_CREDENTIALS', 'Email or password is incorrect', { status: 401 }),
    )
    const service = createHttpAuthService()

    const result = await service.signIn({
      email: 'olivia@example.com',
      password: 'wrong-password',
    })

    expect(result).toEqual({ ok: false, error: { code: 'INVALID_CREDENTIALS' } })
    expect(mockSetTokens).not.toHaveBeenCalled()
    expect(mockSetCachedSession).not.toHaveBeenCalled()
  })

  it('does not clear a usable local session when password reset fails', async () => {
    mockPostPublic.mockRejectedValueOnce(
      new ApiError('TOKEN_EXPIRED', 'Reset token expired', { status: 401 }),
    )
    const service = createHttpAuthService()

    const result = await service.resetPassword({
      token: 'expired-token',
      newPassword: 'Password1!',
    })

    expect(result).toEqual({ ok: false, error: { code: 'TOKEN_EXPIRED' } })
    expect(mockClearTokens).not.toHaveBeenCalled()
    expect(mockSetCachedSession).not.toHaveBeenCalled()
  })

  it('does not call logout when there is no local refresh token', async () => {
    mockGetRefreshToken.mockReturnValue(null)
    const service = createHttpAuthService()

    await service.signOut()

    expect(mockPostPublic).not.toHaveBeenCalled()
    expect(mockClearTokens).toHaveBeenCalledTimes(1)
    expect(mockSetCachedSession).toHaveBeenCalledWith(null)
  })
})
