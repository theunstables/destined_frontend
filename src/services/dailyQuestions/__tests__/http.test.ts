import { get, put } from '@/services/http/client'
import { ApiError } from '@/services/http/errors'
import { createHttpDailyQuestionService } from '@/services/dailyQuestions/http'

jest.mock('@/config/env', () => ({ requireApiUrl: jest.fn(() => 'http://localhost:4000/v1') }))
jest.mock('@/services/http/client', () => ({ get: jest.fn(), put: jest.fn() }))

const mockGet = jest.mocked(get)
const mockPut = jest.mocked(put)

describe('HTTP daily-question service', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each(['NO_COUPLE', 'FORBIDDEN', 'VALIDATION_ERROR', 'NETWORK'] as const)(
    'preserves the %s error from both operations',
    async (code) => {
      mockGet.mockRejectedValueOnce(new ApiError(code, code))
      mockPut.mockRejectedValueOnce(new ApiError(code, code))
      const service = createHttpDailyQuestionService()

      expect(await service.getToday()).toEqual({ ok: false, error: { code } })
      expect(await service.answer('Answer')).toEqual({ ok: false, error: { code } })
    },
  )

  it('narrows unexpected failures to UNKNOWN', async () => {
    mockGet.mockRejectedValueOnce(new ApiError('CONFLICT', 'conflict'))

    expect(await createHttpDailyQuestionService().getToday()).toEqual({
      ok: false,
      error: { code: 'UNKNOWN' },
    })
  })
})