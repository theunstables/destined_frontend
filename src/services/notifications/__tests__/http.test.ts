import { get, put } from '@/services/http/client'
import { ApiError } from '@/services/http/errors'
import { createHttpNotificationService } from '@/services/notifications/http'

jest.mock('@/config/env', () => ({ requireApiUrl: jest.fn(() => 'http://localhost:4000/v1') }))
jest.mock('@/services/http/client', () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
  request: jest.fn(),
}))

const mockGet = jest.mocked(get)
const mockPut = jest.mocked(put)
const preferences = {
  enabled: true,
  messages: true,
  occasions: false,
  memories: true,
  quietStart: '22:00',
  quietEnd: '07:00',
  timezone: 'Asia/Kolkata',
}

describe('HTTP Notification service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reads durable notification preferences', async () => {
    mockGet.mockResolvedValueOnce(preferences)

    const result = await createHttpNotificationService().getPreferences()

    expect(mockGet).toHaveBeenCalledWith('/notifications/preferences')
    expect(result).toEqual({ ok: true, value: preferences })
  })

  it('replaces notification preferences with the complete server contract', async () => {
    mockPut.mockResolvedValueOnce({ ...preferences, messages: false })

    const result = await createHttpNotificationService().updatePreferences({
      ...preferences,
      messages: false,
    })

    expect(mockPut).toHaveBeenCalledWith('/notifications/preferences', {
      ...preferences,
      messages: false,
    })
    expect(result).toEqual({ ok: true, value: { ...preferences, messages: false } })
  })

  it('preserves network failures as stable screen-layer errors', async () => {
    mockGet.mockRejectedValueOnce(new ApiError('NETWORK', 'offline'))

    const result = await createHttpNotificationService().getPreferences()

    expect(result).toEqual({ ok: false, error: { code: 'NETWORK' } })
  })
})