import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { SETTINGS_DELETE_COPY as COPY } from '@/copy/settingsDeleteAccount'
import { SectionPanel } from '@/design-system/patterns/SectionPanel'
import { SettingsScreenLayout } from '@/design-system/patterns/SettingsScreenLayout'
import { Button } from '@/design-system/primitives/Button'
import { Text } from '@/design-system/primitives/Text'
import { DeleteProgress } from '@/modules/module-05-profile/components/DeleteProgress'
import { DeleteReason } from '@/modules/module-05-profile/components/DeleteReason'
import { DeleteWarning } from '@/modules/module-05-profile/components/DeleteWarning'
import { accountService } from '@/services/account'
import { useAccountStore } from '@/state/accountStore'

type Step = 'warning' | 'reason'

const STEP_NUMBER: Record<Step, number> = {
  warning: 1,
  reason: 2,
}

const TOTAL_STEPS = 2

function formatExecutionDate(value: string | null | undefined) {
  if (!value) return 'the end of the 30-day grace period'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'the end of the 30-day grace period'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * M05-S24 — Settings → Delete Account.
 *
 * ONE ROUTE, TWO EXPLANATION STEPS. Pushing each gate as its own route
 * would put the back gesture in charge of the flow — swiping back from the
 * email gate would land on the phone gate with a code already spent, and
 * swiping back twice would land on a password gate that had already passed.
 * Holding the step here means BACK ALWAYS MEANS ONE THING: leave, delete
 * nothing.
 *
 * The backend owns the 30-day grace period. This screen schedules or cancels
 * that durable request; it never clears local identity and claims erasure has
 * already happened.
 */
export function DeleteAccountScreen() {
  const router = useRouter()
  const deletion = useAccountStore((state) => state.deletion)
  const setDeletion = useAccountStore((state) => state.setDeletion)

  const [step, setStep] = useState<Step>('warning')
  const [isAsking, setIsAsking] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const [statusLoaded, setStatusLoaded] = useState(deletion !== undefined)

  const leave = useCallback(() => router.back(), [router])
  const goToExport = useCallback(() => router.push('/(app)/settings/data'), [router])

  useEffect(() => {
    if (deletion !== undefined) {
      setStatusLoaded(true)
      return
    }

    let active = true
    void accountService.getDeletionStatus().then((result) => {
      if (!active) return
      if (result.ok) setDeletion(result.value)
      setStatusLoaded(true)
    })

    return () => { active = false }
  }, [deletion, setDeletion])
  const requestDeletion = useCallback(async () => {
    setIsAsking(false)
    setWorking(true)
    setError(null)
    const result = await accountService.requestDeletion()
    setWorking(false)

    if (!result.ok) {
      setError(COPY.requestError)
      return
    }

    setDeletion(result.value)
  }, [setDeletion])

  const cancelDeletion = useCallback(async () => {
    setWorking(true)
    setError(null)
    const result = await accountService.cancelDeletion()
    setWorking(false)

    if (!result.ok) {
      setError(COPY.cancelError)
      return
    }

    setDeletion(result.value)
    setCancelled(true)
  }, [setDeletion])

  const confirmDestroy = useCallback(() => {
    void requestDeletion()
  }, [requestDeletion])

  if (!statusLoaded) return <SettingsScreenLayout title={COPY.title} onBack={leave} />

  if (deletion?.pending) {
    return (
      <SettingsScreenLayout title={COPY.title} onBack={leave}>
        <SectionPanel title={COPY.doneHeading}>
          <Text variant="body" tone="body">
            {COPY.doneLede(formatExecutionDate(deletion.executeAfter))}
          </Text>
          <Button
            label={COPY.cancelDeletion}
            onPress={cancelDeletion}
            loading={working}
            disabled={working}
            variant="outline"
          />
        </SectionPanel>
        {error ? (
          <Text variant="footnote" tone="error" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </SettingsScreenLayout>
    )
  }

  return (
    <SettingsScreenLayout title={COPY.title} onBack={leave}>
      <DeleteProgress step={STEP_NUMBER[step]} total={TOTAL_STEPS} />

      {cancelled ? (
        <Text variant="footnote" tone="success" accessibilityLiveRegion="polite">
          {COPY.cancellationComplete}
        </Text>
      ) : null}

      {step === 'warning' ? (
        <DeleteWarning onContinue={() => setStep('reason')} onExport={goToExport} />
      ) : null}

      {step === 'reason' ? (
        <DeleteReason
          onChoose={() => setIsAsking(true)}
          onSkip={() => setIsAsking(true)}
        />
      ) : null}

      {error ? (
        <Text variant="footnote" tone="error" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <ConfirmDialog
        visible={isAsking}
        title={COPY.finalTitle}
        body={COPY.finalBody}
        cancelLabel={COPY.finalCancel}
        confirmLabel={COPY.finalConfirm}
        onCancel={() => setIsAsking(false)}
        onConfirm={confirmDestroy}
      />
    </SettingsScreenLayout>
  )
}
