import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { isMockMode } from '@/config/env'
import { SETTINGS_DATA_COPY as COPY } from '@/copy/settingsData'
import { DangerRow } from '@/design-system/patterns/DangerRow'
import { SectionPanel } from '@/design-system/patterns/SectionPanel'
import { SettingsChoiceRow } from '@/design-system/patterns/SettingsChoiceRow'
import { SettingsRow } from '@/design-system/patterns/SettingsRow'
import { SettingsScreenLayout } from '@/design-system/patterns/SettingsScreenLayout'
import { Text } from '@/design-system/primitives/Text'
import { StorageBar } from '@/modules/module-05-profile/components/StorageBar'
import { formatBytes, MOCK_STORAGE } from '@/modules/module-05-profile/data/mock'
import { deliverAccountExport } from '@/modules/module-05-profile/exportAccountData'
import { accountService } from '@/services/account'
import { storageUsageService } from '@/services/storageUsage'
import {
  usePreferencesStore,
  type AutoDownload,
  type UploadQuality,
} from '@/state/preferencesStore'

const DOWNLOAD_SEGMENTS: { value: AutoDownload; label: string }[] = [
  { value: 'never', label: COPY.never },
  { value: 'wifi', label: COPY.wifi },
  { value: 'always', label: COPY.always },
]

const QUALITY_SEGMENTS: { value: UploadQuality; label: string }[] = [
  { value: 'standard', label: COPY.standard },
  { value: 'high', label: COPY.high },
]

/**
 * M05-S16 — Settings → Data & Storage.
 *
 * Clearing the cache removes the cache slice from the breakdown and recomputes
 * the total, so the bar visibly shrinks. A storage screen whose numbers do not
 * move after you free space is the clearest possible way to tell someone the
 * button did nothing.
 */
export function DataScreen() {
  const router = useRouter()
  const autoDownload = usePreferencesStore((s) => s.autoDownload)
  const uploadQuality = usePreferencesStore((s) => s.uploadQuality)
  const setPreference = usePreferencesStore((s) => s.setPreference)

  const [storage, setStorage] = useState(MOCK_STORAGE)
  const [usageError, setUsageError] = useState(false)
  const [isCacheCleared, setIsCacheCleared] = useState(false)
  const [exportState, setExportState] = useState<'idle' | 'preparing' | 'ready' | 'error'>('idle')
  const exportInFlight = useRef(false)

  const goBack = useCallback(() => router.back(), [router])

  useEffect(() => {
    if (isMockMode) return
    let active = true
    void storageUsageService.get().then(
      (usage) => {
        if (!active) return
        setStorage({
          totalBytes: usage.totalBytes,
          slices: [
            { key: 'photos', label: 'Photos', bytes: usage.photoBytes },
            { key: 'video', label: 'Video moments', bytes: usage.videoBytes },
            { key: 'voice', label: 'Voice notes', bytes: usage.audioBytes },
          ],
        })
      },
      () => { if (active) setUsageError(true) },
    )
    return () => { active = false }
  }, [])

  const clearCache = useCallback(async () => {
    await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()])
    if (isMockMode) {
      setStorage((current) => {
        const slices = current.slices.filter((slice) => slice.key !== 'cache')

        return {
          slices,
          totalBytes: slices.reduce((total, slice) => total + slice.bytes, 0),
        }
      })
    }
    setIsCacheCleared(true)
  }, [])

  const requestExport = useCallback(async () => {
    if (exportInFlight.current) return
    exportInFlight.current = true
    setExportState('preparing')
    const result = await accountService.exportData()

    if (!result.ok) {
      exportInFlight.current = false
      setExportState('error')
      return
    }

    try {
      await deliverAccountExport(result.value)
      setExportState('ready')
    } catch {
      setExportState('error')
    } finally {
      exportInFlight.current = false
    }
  }, [])

  return (
    <SettingsScreenLayout title={COPY.title} lede={COPY.lede} onBack={goBack}>
      <SectionPanel title={COPY.usageGroup}>
        {!usageError ? (
          <>
            <Text variant="h3" tone="heading">
              {`${COPY.totalPrefix} ${formatBytes(storage.totalBytes)}`}
            </Text>
            <StorageBar slices={storage.slices} totalBytes={storage.totalBytes} />
            {storage.slices.map((slice) => (
              <SettingsRow
                key={slice.key}
                icon="circle"
                label={slice.label}
                value={formatBytes(slice.bytes)}
              />
            ))}
          </>
        ) : (
          <Text variant="body" tone="body">{COPY.usageUnavailable}</Text>
        )}
      </SectionPanel>

      <SectionPanel title={COPY.cacheGroup}>
          <DangerRow
            icon="trash-2"
            label={COPY.clearCache}
            detail={COPY.clearCacheDetail}
            confirmTitle={COPY.clearCacheTitle}
            confirmBody={COPY.clearCacheBody}
            cancelLabel={COPY.clearCacheCancel}
            confirmLabel={COPY.clearCacheConfirm}
            onConfirm={() => { void clearCache() }}
          />

          {isCacheCleared ? (
            <Text variant="footnote" tone="success">
              {COPY.cacheCleared}
            </Text>
          ) : null}
      </SectionPanel>

      <SectionPanel title={COPY.transferGroup}>
          <SettingsChoiceRow
            label={COPY.autoDownloadLabel}
            segments={DOWNLOAD_SEGMENTS}
            value={autoDownload}
            onChange={(next) => setPreference('autoDownload', next)}
          />
          <SettingsChoiceRow
            label={COPY.qualityLabel}
            detail={COPY.qualityDetail}
            segments={QUALITY_SEGMENTS}
            value={uploadQuality}
            onChange={(next) => setPreference('uploadQuality', next)}
          />
      </SectionPanel>

      <SectionPanel title={COPY.exportGroup}>
        <SettingsRow
          icon="download"
          label={COPY.download}
          detail={COPY.downloadDetail}
          onPress={requestExport}
        />

        {exportState === 'preparing' ? (
          <Text variant="footnote" tone="body" accessibilityLiveRegion="polite">
            {COPY.downloadPreparing}
          </Text>
        ) : exportState === 'ready' ? (
          <Text variant="footnote" tone="success" accessibilityLiveRegion="polite">
            {COPY.downloadReady}
          </Text>
        ) : exportState === 'error' ? (
          <Text variant="footnote" tone="error" accessibilityRole="alert">
            {COPY.downloadError}
          </Text>
        ) : null}
      </SectionPanel>
    </SettingsScreenLayout>
  )
}
