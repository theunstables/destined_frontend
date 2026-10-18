import { del, get, put } from '@/services/http/client'
import { createHttpSharedPlacesService } from '@/services/sharedPlaces/http'

jest.mock('@/services/http/client', () => ({
  del: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
}))

const mockDel = jest.mocked(del)
const mockGet = jest.mocked(get)
const mockPut = jest.mocked(put)

const response = {
  me: {
    who: 'me' as const,
    name: 'Maya',
    latitude: 51.5074,
    longitude: -0.1278,
    accuracyMeters: 8,
    battery: null,
    activity: null,
    updatedSecondsAgo: 2,
    sharedUntil: null,
    minutesRemaining: null,
  },
  partner: null,
  distanceKilometers: null,
}

describe('HTTP Shared Places service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('maps backend coordinates into the frontend snapshot', async () => {
    mockGet.mockResolvedValueOnce(response)

    const result = await createHttpSharedPlacesService().get()

    expect(mockGet).toHaveBeenCalledWith('/plans/places')
    expect(result.me?.coordinate).toEqual({ latitude: 51.5074, longitude: -0.1278 })
    expect(result.me).not.toHaveProperty('latitude')
    expect(result.me).not.toHaveProperty('longitude')
  })

  it.each([
    ['1h', 'ONE_HOUR'],
    ['tonight', 'TONIGHT'],
    ['until-off', 'UNTIL_OFF'],
  ] as const)('maps the %s sharing window to %s', async (window, backendWindow) => {
    mockPut.mockResolvedValueOnce(response)

    await createHttpSharedPlacesService().share({
      latitude: 51.5074,
      longitude: -0.1278,
      accuracyMeters: 8,
    }, window)

    expect(mockPut).toHaveBeenCalledWith('/plans/places/me', {
      latitude: 51.5074,
      longitude: -0.1278,
      accuracyMeters: 8,
      battery: null,
      activity: null,
      timezone: expect.any(String),
      window: backendWindow,
    })
  })

  it('deletes the current fix when sharing is paused', async () => {
    mockDel.mockResolvedValueOnce({ ...response, me: null })

    const result = await createHttpSharedPlacesService().pause()

    expect(mockDel).toHaveBeenCalledWith('/plans/places/me')
    expect(result.me).toBeNull()
  })
})
