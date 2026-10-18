import { createHttpAccountService } from '@/services/account/http'
import { get, post, request } from '@/services/http/client'
import { ApiError } from '@/services/http/errors'

jest.mock('@/config/env', () => ({ requireApiUrl: jest.fn(() => 'http://localhost:4000/v1') }))
jest.mock('@/services/http/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  request: jest.fn(),
}))

const mockGet = jest.mocked(get)
const mockPost = jest.mocked(post)
const mockRequest = jest.mocked(request)
const pending = {
  pending: true,
  requestedAt: '2026-10-12T00:00:00Z',
  executeAfter: '2026-11-11T00:00:00Z',
}

describe('HTTP Account service', () => {
  beforeEach(() => jest.clearAllMocks())

  it('reads and schedules deletion through the grace-period endpoint', async () => {
    mockGet.mockResolvedValueOnce({ pending: false })
    mockPost.mockResolvedValueOnce(pending)
    const service = createHttpAccountService()

    expect(await service.getDeletionStatus()).toEqual({ ok: true, value: { pending: false } })
    expect(await service.requestDeletion()).toEqual({ ok: true, value: pending })
    expect(mockGet).toHaveBeenCalledWith('/account/deletion')
    expect(mockPost).toHaveBeenCalledWith('/account/deletion')
  })

  it('cancels a pending deletion request', async () => {
    mockRequest.mockResolvedValueOnce({ data: { pending: false }, meta: {} })

    const result = await createHttpAccountService().cancelDeletion()

    expect(mockRequest).toHaveBeenCalledWith('/account/deletion', { method: 'DELETE' })
    expect(result).toEqual({ ok: true, value: { pending: false } })
  })

  it('downloads the complete account export', async () => {
    const accountExport = {
      generatedAt: '2026-10-12T00:00:00Z',
      data: { profile: { displayName: 'Maya' }, memories: [] },
    }
    mockGet.mockResolvedValueOnce(accountExport)

    const result = await createHttpAccountService().exportData()

    expect(mockGet).toHaveBeenCalledWith('/account/export')
    expect(result).toEqual({ ok: true, value: accountExport })
  })

  it('maps transport failures to stable account errors', async () => {
    mockPost.mockRejectedValueOnce(new ApiError('NETWORK', 'offline'))

    const result = await createHttpAccountService().requestDeletion()

    expect(result).toEqual({ ok: false, error: { code: 'NETWORK' } })
  })
})