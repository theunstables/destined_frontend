import { del, get, put } from '@/services/http/client'
import type {
  LocationFix,
  SharedLocation,
  SharedPlacesService,
  SharedPlacesSnapshot,
} from '@/services/sharedPlaces/types'
import type { ShareWindow } from '@/services/plans/types'

type LocationResponse = Omit<SharedLocation, 'coordinate'> & {
  latitude: number
  longitude: number
}

type PlacesResponse = {
  me: LocationResponse | null
  partner: LocationResponse | null
  distanceKilometers: number | null
}

const WINDOW: Record<ShareWindow, 'ONE_HOUR' | 'TONIGHT' | 'UNTIL_OFF'> = {
  '1h': 'ONE_HOUR',
  tonight: 'TONIGHT',
  'until-off': 'UNTIL_OFF',
}

function location(row: LocationResponse | null): SharedLocation | null {
  if (!row) return null
  const { latitude, longitude, ...rest } = row
  return { ...rest, coordinate: { latitude, longitude } }
}

function snapshot(value: PlacesResponse): SharedPlacesSnapshot {
  return {
    me: location(value.me),
    partner: location(value.partner),
    distanceKilometers: value.distanceKilometers,
  }
}

export function createHttpSharedPlacesService(): SharedPlacesService {
  return {
    async get() {
      return snapshot(await get<PlacesResponse>('/plans/places'))
    },
    async share(fix: LocationFix, window: ShareWindow) {
      return snapshot(await put<PlacesResponse>('/plans/places/me', {
        latitude: fix.latitude,
        longitude: fix.longitude,
        accuracyMeters: fix.accuracyMeters,
        battery: null,
        activity: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        window: WINDOW[window],
      }))
    },
    async pause() {
      return snapshot(await del<PlacesResponse>('/plans/places/me'))
    },
  }
}
