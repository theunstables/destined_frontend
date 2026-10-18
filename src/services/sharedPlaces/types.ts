import type { Coordinate, ShareWindow } from '@/services/plans/types'

export type SharedLocation = {
  who: 'me' | 'partner'
  name: string
  coordinate: Coordinate
  accuracyMeters: number | null
  battery: number | null
  activity: string | null
  updatedSecondsAgo: number
  sharedUntil: string | null
  minutesRemaining: number | null
}

export type SharedPlacesSnapshot = {
  me: SharedLocation | null
  partner: SharedLocation | null
  distanceKilometers: number | null
}

export type LocationFix = Coordinate & {
  accuracyMeters: number | null
}

export type SharedPlacesService = {
  get: () => Promise<SharedPlacesSnapshot>
  share: (fix: LocationFix, window: ShareWindow) => Promise<SharedPlacesSnapshot>
  pause: () => Promise<SharedPlacesSnapshot>
}
