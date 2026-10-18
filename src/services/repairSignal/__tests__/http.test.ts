import { del, get, post } from '@/services/http/client'
import { ApiError } from '@/services/http/errors'
import { createHttpRepairSignalService } from '@/services/repairSignal/http'

jest.mock('@/config/env', () => ({ requireApiUrl: jest.fn(() => 'http://localhost:4000/v1') }))
jest.mock('@/services/http/client', () => ({ del: jest.fn(), get: jest.fn(), post: jest.fn() }))

const mockDel = jest.mocked(del)
const mockGet = jest.mocked(get)
const mockPost = jest.mocked(post)

describe('HTTP repair-signal service', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each(['NO_COUPLE', 'FORBIDDEN', 'NETWORK'] as const)(
    'preserves the %s error from every operation',
    async (code) => {
      mockGet.mockRejectedValueOnce(new ApiError(code, code))
      mockPost.mockRejectedValueOnce(new ApiError(code, code))
      mockDel.mockRejectedValueOnce(new ApiError(code, code))
      const service = createHttpRepairSignalService()

      expect(await service.current()).toEqual({ ok: false, error: { code } })
      expect(await service.send()).toEqual({ ok: false, error: { code } })
      expect(await service.cancel()).toEqual({ ok: false, error: { code } })
    },
  )

  it('narrows unexpected failures to UNKNOWN', async () => {
    mockPost.mockRejectedValueOnce(new Error('boom'))

    expect(await createHttpRepairSignalService().send()).toEqual({
      ok: false,
      error: { code: 'UNKNOWN' },
    })
  })
})