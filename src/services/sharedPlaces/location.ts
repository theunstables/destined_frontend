import type { LocationFix } from '@/services/sharedPlaces/types'

type BrowserGeolocation = {
  getCurrentPosition: (
    success: (position: { coords: { latitude: number; longitude: number; accuracy: number } }) => void,
    failure: (error: unknown) => void,
    options: { enableHighAccuracy: boolean; timeout: number; maximumAge: number },
  ) => void
}

/**
 * Reads a foreground browser fix. Native capture uses the same service boundary,
 * but requires `expo-location`; installation is intentionally not faked when the
 * package registry is unavailable.
 */
export function currentLocation(): Promise<LocationFix> {
  const geolocation = (globalThis as { navigator?: { geolocation?: BrowserGeolocation } })
    .navigator?.geolocation
  if (!geolocation) {
    return Promise.reject(new Error('Location is unavailable on this device build.'))
  }

  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
      }),
      () => reject(new Error('Location permission was denied or no fix was available.')),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    )
  })
}
