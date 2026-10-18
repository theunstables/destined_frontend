import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { CONNECTING_COPY as COPY } from '@/copy/connecting'
import { StatusScreen } from '@/design-system/patterns/StatusScreen'
import { Button } from '@/design-system/primitives/Button'
import { AuthEyebrow } from '@/modules/module-00-auth/components/AuthEyebrow'
import { AuthScreenLayout } from '@/modules/module-00-auth/components/AuthScreenLayout'
import { FloatingInfoCard } from '@/modules/module-00-auth/components/FloatingInfoCard'
import { pairingService } from '@/services/pairing'
import { useRelationshipStore } from '@/state/relationshipStore'

/**
 * M01-S07 — Connecting. Figma 522:738.
 *
 * Commits the relationship, then REPLACES rather than pushes: pushing a
 * progress screen leaves it in the back stack, so a user who presses back lands
 * on a spinner for an operation that already finished.
 *
 * A failure gets a message and a retry rather than an endless spinner — the one
 * outcome a progress screen must never produce is silence.
 */
export function ConnectingScreen() {
  const router = useRouter()
  const { theme } = useUnistyles()
  const partner = useRelationshipStore((state) => state.partner)
  const connect = useRelationshipStore((state) => state.connect)
  const [error, setError] = useState<string | null>(null)

  /**
   * The request outlives the screen when a user backs out mid-connect. Without
   * this guard its late success still fires `replace`, yanking them to a
   * "connected" screen from wherever they had navigated to.
   */
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  const attempt = useCallback(async () => {
    if (!partner) {
      router.replace('/(onboarding)/enter-code')
      return
    }

    setError(null)

    const result = await pairingService.confirmPartner({ partnerId: partner.id })

    if (!mounted.current) return

    if (!result.ok) {
      setError(COPY.errors[result.error.code])
      return
    }

    connect()
    router.replace('/(onboarding)/connected')
  }, [partner, connect, router])

  useEffect(() => {
    void attempt()
    // Runs once. `attempt` is stable for a given partner, and re-running on
    // every render would hammer the service.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const returnToCode = useCallback(
    () => router.replace('/(onboarding)/enter-code'),
    [router],
  )

  return (
    <AuthScreenLayout centred>
      <View style={styles.eyebrow}>
        <AuthEyebrow align="center">
          {error ? COPY.errorEyebrow : COPY.eyebrow}
        </AuthEyebrow>
      </View>
      <StatusScreen
        illustration={
          error ? (
            <View style={styles.errorMedallion}>
              <Feather name="rotate-cw" size={40} color={theme.colors.feedback.error} />
            </View>
          ) : (
            <ActivityIndicator size="large" color={theme.colors.brand.primary} />
          )
        }
        heading={error ? COPY.errorHeading : COPY.heading}
        lede={error ? COPY.errorLede : COPY.lede}
        actions={
          error ? (
            <>
              <FloatingInfoCard
                icon="alert-circle"
                title={COPY.errorHeading}
                body={error}
                tone="error"
              />
              <Button label={COPY.retry} onPress={attempt} />
              <Button label={COPY.returnToCode} onPress={returnToCode} variant="outline" />
            </>
          ) : undefined
        }
        announce={Boolean(error)}
      />
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  eyebrow: {
    paddingBottom: theme.spacing.lg,
  },
  errorMedallion: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.feedback.error,
    borderRadius: theme.radii.medallion,
    backgroundColor: theme.colors.surface.soft,
    boxShadow: theme.elevation.medallion,
  },
}))
