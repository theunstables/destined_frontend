import { Platform, Share } from 'react-native'

import type { AccountExport } from '@/services/account'

/** Delivers the already-generated export without sending it through another service. */
export async function deliverAccountExport(accountExport: AccountExport): Promise<void> {
  const json = JSON.stringify(accountExport, null, 2)
  const day = accountExport.generatedAt.slice(0, 10) || new Date().toISOString().slice(0, 10)
  const filename = `destined-data-export-${day}.json`

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    return
  }

  // React Native's built-in share sheet is the only dependency-free way to
  // hand a generated payload to Files, Drive, email, or another destination.
  await Share.share({ title: filename, message: json })
}