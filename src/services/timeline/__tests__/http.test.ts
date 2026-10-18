import { createHttpTimelineService } from '@/services/timeline/http'
import { request } from '@/services/http/client'
import { ApiError } from '@/services/http/errors'

jest.mock('@/config/env', () => ({ requireApiUrl: jest.fn(() => 'http://localhost:4000/v1') }))
jest.mock('@/services/http/client', () => ({ request: jest.fn() }))

const mockRequest = jest.mocked(request)

describe('HTTP Timeline service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes cursor paging through to the timeline projection', async () => {
    const items = [{ id: 'memory-1', type: 'memory' as const, date: '2025-02-14', title: 'Picnic' }]
    mockRequest.mockResolvedValueOnce({ data: items, meta: { nextCursor: 'older-1' } })

    const result = await createHttpTimelineService().list({ cursor: 'page-1', limit: 20 })

    expect(mockRequest).toHaveBeenCalledWith('/timeline', {
      method: 'GET',
      query: { cursor: 'page-1', limit: 20 },
    })
    expect(result).toEqual({ ok: true, value: { items, nextCursor: 'older-1' } })
  })

  it('preserves network failures without exposing transport prose', async () => {
    mockRequest.mockRejectedValueOnce(new ApiError('NETWORK', 'offline'))

    const result = await createHttpTimelineService().list()

    expect(result).toEqual({ ok: false, error: { code: 'NETWORK' } })
  })

  it('maps other failures to a stable unknown state', async () => {
    mockRequest.mockRejectedValueOnce(new ApiError('FORBIDDEN', 'server prose'))

    const result = await createHttpTimelineService().list()

    expect(result).toEqual({ ok: false, error: { code: 'UNKNOWN' } })
  })
})