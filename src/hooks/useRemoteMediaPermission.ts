import { useState } from 'react'

import { usePreferencesStore } from '@/state/preferencesStore'

const isRemote = (uri: string) => /^https?:\/\//i.test(uri)

function wifiConnected(): boolean {
  if (typeof navigator === 'undefined') return false
  const connection = (navigator as Navigator & { connection?: { type?: string } }).connection
  return connection?.type === 'wifi'
}

export function useRemoteMediaPermission(uri: string) {
  const preference = usePreferencesStore((state) => state.autoDownload)
  const [manuallyAllowed, setManuallyAllowed] = useState(false)
  const allowed = !isRemote(uri)
    || preference === 'always'
    || (preference === 'wifi' && wifiConnected())
    || manuallyAllowed
  return { allowed, allow: () => setManuallyAllowed(true) }
}
