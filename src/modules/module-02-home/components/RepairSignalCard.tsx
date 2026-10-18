import { Feather } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { REPAIR_SIGNAL_COPY as COPY } from '@/copy/repairSignal'
import { Button } from '@/design-system/primitives/Button'
import { Card } from '@/design-system/primitives/Card'
import { Text } from '@/design-system/primitives/Text'
import { useRepairSignalStore } from '@/state/repairSignalStore'

/** RS01 on Home: a consent-forward invitation to reconnect, never a demand. */
export function RepairSignalCard() {
  const { theme } = useUnistyles()
  const signal = useRepairSignalStore((state) => state.signal)
  const hydrated = useRepairSignalStore((state) => state.hydrated)
  const loading = useRepairSignalStore((state) => state.loading)
  const error = useRepairSignalStore((state) => state.error)
  const send = useRepairSignalStore((state) => state.send)
  const cancel = useRepairSignalStore((state) => state.cancel)
  const refresh = useRepairSignalStore((state) => state.refresh)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const actionInFlight = useRef(false)

  useEffect(() => {
    if (!hydrated) void refresh()
  }, [hydrated, refresh])

  const isMutual = signal?.status === 'mutual' || signal?.mutual
  const isReceived = Boolean(signal && !signal.sentByMe && !isMutual)
  const heading = isMutual
    ? COPY.mutualHeading
    : isReceived
      ? COPY.receivedHeading
      : signal
        ? COPY.sentHeading
        : COPY.idleHeading
  const body = isMutual
    ? COPY.mutualBody
    : isReceived
      ? COPY.receivedBody
      : signal
        ? COPY.sentBody
        : COPY.idleBody

  const confirmCancel = useCallback(async () => {
    if (actionInFlight.current) return
    actionInFlight.current = true
    setConfirmingCancel(false)
    await cancel()
    actionInFlight.current = false
  }, [cancel])

  const sendSignal = useCallback(async () => {
    if (actionInFlight.current) return
    actionInFlight.current = true
    await send()
    actionInFlight.current = false
  }, [send])

  if (!hydrated) return null

  return (
    <Card>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Feather name="heart" size={20} color={theme.colors.brand.primary} />
        </View>
        <View style={styles.copy}>
          <Text variant="caption" tone="brand">
            {COPY.eyebrow}
          </Text>
          <Text variant="h3" tone="heading">
            {heading}
          </Text>
        </View>
      </View>

      <Text variant="footnote" tone="body">
        {body}
      </Text>

      {error ? (
        <Text variant="footnote" tone="error" accessibilityRole="alert">
          {COPY.errors[error]}
        </Text>
      ) : null}

      {!isMutual ? (
        signal?.sentByMe ? (
          <Button
            label={COPY.cancel}
            onPress={() => setConfirmingCancel(true)}
            variant="outline"
            disabled={loading}
          />
        ) : (
          <Button
            label={isReceived ? COPY.meet : COPY.send}
            onPress={sendSignal}
            loading={loading}
            disabled={loading}
          />
        )
      ) : null}

      <ConfirmDialog
        visible={confirmingCancel}
        title={COPY.confirmTitle}
        body={COPY.confirmBody}
        cancelLabel={COPY.keep}
        confirmLabel={COPY.confirmCancel}
        onCancel={() => setConfirmingCancel(false)}
        onConfirm={confirmCancel}
      />
    </Card>
  )
}

const styles = StyleSheet.create((theme) => ({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.field,
    backgroundColor: theme.colors.surface.soft,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
}))
