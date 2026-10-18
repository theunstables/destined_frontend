import { post, postPublic } from '@/services/http/client'
import {
  getAccessToken,
  getRefreshToken,
  hydrate,
  isAccessTokenExpired,
} from '@/services/http/tokens'

jest.mock('@/config/env', () => ({
  API_URL: 'http://localhost:4000',
  isMockMode: false,
}))

jest.mock('@/services/http/tokens', () => ({
  clearTokens: jest.fn(),
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  hydrate: jest.fn(),
  isAccessTokenExpired: jest.fn(),
  setTokens: jest.fn(),
}))

const mockGetAccessToken = jest.mocked(getAccessToken)
const mockGetRefreshToken = jest.mocked(getRefreshToken)
const mockHydrate = jest.mocked(hydrate)
const mockIsAccessTokenExpired = jest.mocked(isAccessTokenExpired)

function successResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: { get: jest.fn(() => null) },
    json: jest.fn(async () => ({ data })),
  } as unknown as Response
}

describe('HTTP client authentication modes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAccessToken.mockReturnValue('existing-access-token')
    mockGetRefreshToken.mockReturnValue('existing-refresh-token')
    mockIsAccessTokenExpired.mockReturnValue(false)
    global.fetch = jest.fn(async () => successResponse({ accepted: true }))
  })

  it('does not hydrate, refresh, or attach bearer credentials to a public POST', async () => {
    await postPublic('/auth/password/forgot', { email: 'olivia@example.com' })

    expect(mockHydrate).not.toHaveBeenCalled()
    expect(mockIsAccessTokenExpired).not.toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/v1/auth/password/forgot',
      expect.objectContaining({
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
      }),
    )
  })

  it('hydrates and attaches bearer credentials to an authenticated POST', async () => {
    await post('/pairing/invites')

    expect(mockHydrate).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/v1/pairing/invites',
      expect.objectContaining({
        method: 'POST',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer existing-access-token',
        },
      }),
    )
  })
})
