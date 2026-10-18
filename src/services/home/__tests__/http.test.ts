import { createHttpHomeService } from '@/services/home/http'
import { get } from '@/services/http/client'
import { ApiError } from '@/services/http/errors'

jest.mock('@/config/env', () => ({ requireApiUrl: jest.fn(() => 'http://localhost:4000/v1') }))
jest.mock('@/services/http/client', () => ({ get: jest.fn() }))

const mockGet = jest.mocked(get)

const dashboard = {
  coupleName: 'Olivia & Jordan',
  greetingName: 'Olivia',
  space: { name: 'Our World', shortName: 'OW', coverStyle: 'dawn' },
  daysTogether: 42,
  stats: [{ key: 'together', icon: 'heart', value: '42', label: 'Together', unit: 'days' }],
  comingUp: [],
  recentMemories: [],
  pulse: {
    label: 'Relationship pulse',
    value: '42',
    unit: 'days',
    caption: 'since we first met.',
  },
}

describe('HTTP Home service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reads the backend dashboard projection from /home', async () => {
    mockGet.mockResolvedValueOnce(dashboard)

    const result = await createHttpHomeService().getDashboard()

    expect(mockGet).toHaveBeenCalledWith('/home')
    expect(result).toEqual({ ok: true, value: dashboard })
  })

  it('preserves a network failure as a stable Home error', async () => {
    mockGet.mockRejectedValueOnce(new ApiError('NETWORK', 'offline'))

    const result = await createHttpHomeService().getDashboard()

    expect(result).toEqual({ ok: false, error: { code: 'NETWORK' } })
  })

  it('does not leak unknown server errors to the screen layer', async () => {
    mockGet.mockRejectedValueOnce(new ApiError('FORBIDDEN', 'server prose'))

    const result = await createHttpHomeService().getDashboard()

    expect(result).toEqual({ ok: false, error: { code: 'UNKNOWN' } })
  })
})
