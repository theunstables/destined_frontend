import { Redirect, Slot } from 'expo-router'

import { hasCapability } from '@/config/capabilities'

/**
 * Plans is a visual prototype backed only by local sample state. Keep every
 * nested route reachable in mock previews, but never expose it as a durable
 * feature when the app is connected to the production API.
 */
export default function PlansLayout() {
  return hasCapability('plans') ? <Slot /> : <Redirect href="/(app)/home" />
}