import { SAMPLE_PLACES } from '@/sample/plans'
import type { ShareWindow } from '@/services/plans/types'
import type { SharedPlacesService, SharedPlacesSnapshot } from '@/services/sharedPlaces/types'

let activeWindow: ShareWindow | null = SAMPLE_PLACES.activeWindow

const value = (): SharedPlacesSnapshot => ({
  me: activeWindow ? {
    who: 'me', name: SAMPLE_PLACES.me.name, coordinate: SAMPLE_PLACES.me.coordinate,
    accuracyMeters: null, battery: SAMPLE_PLACES.me.battery,
    activity: SAMPLE_PLACES.me.activity, updatedSecondsAgo: SAMPLE_PLACES.me.updatedMinutesAgo * 60,
    sharedUntil: null, minutesRemaining: SAMPLE_PLACES.minutesRemaining,
  } : null,
  partner: {
    who: 'partner', name: SAMPLE_PLACES.partner.name, coordinate: SAMPLE_PLACES.partner.coordinate,
    accuracyMeters: null, battery: SAMPLE_PLACES.partner.battery,
    activity: SAMPLE_PLACES.partner.activity,
    updatedSecondsAgo: SAMPLE_PLACES.partner.updatedMinutesAgo * 60,
    sharedUntil: null, minutesRemaining: SAMPLE_PLACES.minutesRemaining,
  },
  distanceKilometers: 3.2,
})

export function createMockSharedPlacesService(): SharedPlacesService {
  return {
    async get() { return value() },
    async share(_fix, window) { activeWindow = window; return value() },
    async pause() { activeWindow = null; return value() },
  }
}
