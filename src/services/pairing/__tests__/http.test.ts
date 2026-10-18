import { get, patch, post, put } from '@/services/http/client'
import { ApiError } from '@/services/http/errors'
import { ensureRemoteUri } from '@/services/media'
import { createHttpPairingService } from '@/services/pairing/http'

jest.mock('@/config/env', () => ({ requireApiUrl: jest.fn(() => 'http://localhost:4000/v1') }))
jest.mock('@/services/http/client', () => ({
  get: jest.fn(),
  patch: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}))
jest.mock('@/services/media', () => ({ ensureRemoteUri: jest.fn() }))

const mockGet = jest.mocked(get)
const mockPatch = jest.mocked(patch)
const mockPost = jest.mocked(post)
const mockPut = jest.mocked(put)
const mockEnsureRemoteUri = jest.mocked(ensureRemoteUri)

describe('HTTP pairing service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reads the current profile', async () => {
    const profile = { name: 'Olivia', nickname: 'Liv' }
    mockGet.mockResolvedValueOnce(profile)

    const result = await createHttpPairingService().getProfile()

    expect(mockGet).toHaveBeenCalledWith('/pairing/profile')
    expect(result).toEqual({ ok: true, value: profile })
  })

  it('uploads a local photo and sends only backend profile fields', async () => {
    mockEnsureRemoteUri.mockResolvedValueOnce('https://cdn.example/profile.jpg')
    mockPut.mockResolvedValueOnce({
      name: 'Olivia',
      nickname: 'Liv',
      photoUri: 'https://cdn.example/profile.jpg',
    })

    const result = await createHttpPairingService().createProfile({
      name: 'Olivia',
      nickname: 'Liv',
      birthday: '1994-08-17',
      pronouns: 'she/her',
      photoUri: 'file:///profile.jpg',
      phone: '+15551234567',
      phoneVerified: true,
    })

    expect(mockEnsureRemoteUri).toHaveBeenCalledWith('file:///profile.jpg')
    expect(mockPut).toHaveBeenCalledWith('/pairing/profile', {
      name: 'Olivia',
      nickname: 'Liv',
      birthday: '1994-08-17',
      pronouns: 'she/her',
      photoUri: 'https://cdn.example/profile.jpg',
    })
    expect(result.ok).toBe(true)
  })

  it('maps invite, redeem, confirm, cancel, and space operations to the contract', async () => {
    const invite = { code: 'L8V7QK', expiresAt: '2099-01-01T00:00:00Z' }
    const partner = { id: 'partner-1', name: 'Jordan' }
    const space = { coverStyle: 'dawn' as const, status: 'connected' as const, partner }
    mockPost
      .mockResolvedValueOnce(invite)
      .mockResolvedValueOnce(partner)
      .mockResolvedValueOnce(partner)
      .mockResolvedValueOnce(undefined)
    mockGet.mockResolvedValueOnce(space)
    const service = createHttpPairingService()

    await service.createInvite()
    await service.redeemCode({ code: 'L8V7QK' })
    await service.confirmPartner({ partnerId: 'partner-1' })
    await service.cancelInvite({ code: 'L8V7QK' })
    const result = await service.getSpace()

    expect(mockPost).toHaveBeenNthCalledWith(1, '/pairing/invites')
    expect(mockPost).toHaveBeenNthCalledWith(2, '/pairing/redeem', { code: 'L8V7QK' })
    expect(mockPost).toHaveBeenNthCalledWith(3, '/pairing/confirm', { partnerId: 'partner-1' })
    expect(mockPost).toHaveBeenNthCalledWith(4, '/pairing/invites/cancel', { code: 'L8V7QK' })
    expect(mockGet).toHaveBeenCalledWith('/pairing/space')
    expect(result).toEqual({ ok: true, value: space })
  })

  it('preserves actionable pairing error codes', async () => {
    mockPost.mockRejectedValueOnce(
      new ApiError('ALREADY_PAIRED', 'Account already belongs to a couple', { status: 409 }),
    )

    const result = await createHttpPairingService().redeemCode({ code: 'L8V7QK' })

    expect(result).toEqual({ ok: false, error: { code: 'ALREADY_PAIRED' } })
  })

  it('updates the shared space through the partial space endpoint', async () => {
    const input = { name: 'Maya & Jordan', shortName: 'M + J', coverStyle: 'dusk' as const }
    const space = { ...input, coupleId: 'couple-1', status: 'connected' as const }
    mockPatch.mockResolvedValueOnce(space)

    const result = await createHttpPairingService().updateSpace(input)

    expect(mockPatch).toHaveBeenCalledWith('/pairing/space', input)
    expect(result).toEqual({ ok: true, value: space })
  })

  it('maps lifecycle operations to their endpoints', async () => {
    const connected = {
      status: 'connected' as const,
      sharedWritesAllowed: true,
      unpairPending: false,
      unpairRequestedByMe: false,
    }
    mockGet.mockResolvedValueOnce(connected)
    mockPost.mockResolvedValue(connected)
    const service = createHttpPairingService()

    await service.getLifecycle()
    await service.pause()
    await service.reactivate()
    await service.requestUnpair()
    await service.cancelUnpair()

    expect(mockGet).toHaveBeenCalledWith('/pairing/lifecycle')
    expect(mockPost).toHaveBeenNthCalledWith(1, '/pairing/lifecycle/pause')
    expect(mockPost).toHaveBeenNthCalledWith(2, '/pairing/lifecycle/reactivate')
    expect(mockPost).toHaveBeenNthCalledWith(3, '/pairing/lifecycle/unpair')
    expect(mockPost).toHaveBeenNthCalledWith(4, '/pairing/lifecycle/unpair/cancel')
  })
})