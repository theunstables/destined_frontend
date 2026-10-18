import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { useBackTo } from '@/hooks/useBackTo'
import { isMockMode } from '@/config/env'
import { authErrorMessage } from '@/copy/errors'
import { VERIFY_EMAIL_COPY as COPY } from '@/copy/verifyEmail'
import { useSessionStore } from '@/state/sessionStore'
import { Button } from '@/design-system/primitives/Button'
import { Text } from '@/design-system/primitives/Text'
import { AuthFormError } from '@/modules/module-00-auth/components/AuthFormError'
import { AuthEyebrow } from '@/modules/module-00-auth/components/AuthEyebrow'
import { AuthScreenLayout } from '@/modules/module-00-auth/components/AuthScreenLayout'
import { EnvelopeIllustration } from '@/modules/module-00-auth/components/EnvelopeIllustration'
import { authService } from '@/services/auth'

/** mm:ss. At 60 this reads 01:00; Figma's 00:59 is one tick later. */
function formatCooldown(seconds: number): string {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const rest = String(seconds % 60).padStart(2, '0')

  return `${minutes}:${rest}`
}

/**
 * M00-S04 — Verify Email. Figma 522:226.
 *
 * "Change Email" returns to Create Account rather than pushing a new screen:
 * there is no change-email design, and inventing one would add a sixth screen
 * ID, which `SCREENS.md` rules 2 and 3 forbid without approval.
 */
export function VerifyEmailScreen() {
  const router = useRouter()
  const { token } = useLocalSearchParams<{ token?: string }>()
  const emailVerified = useSessionStore((state) => state.emailVerified)
  const sessionEmail = useSessionStore((state) => state.session?.email ?? '')
  const back = useBackTo('/(auth)/welcome')
  // Explicit `number`: COPY is `as const`, so inference would narrow this to the
  // literal 60 and reject every decrement.
  const [remaining, setRemaining] = useState<number>(COPY.resendCooldownSeconds)
  const [isSending, setIsSending] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let active = true
    setIsChecking(true)
    void authService.verifyEmail({ token }).then((result) => {
      if (!active) return
      setIsChecking(false)
      if (!result.ok) {
        setError(authErrorMessage(result.error.code))
        return
      }
      emailVerified()
      router.replace(sessionEmail ? '/(onboarding)/setup' : '/(auth)/sign-in')
    })
    return () => { active = false }
  }, [emailVerified, router, sessionEmail, token])

  useEffect(() => {
    if (remaining <= 0) return

    const timer = setInterval(() => {
      setRemaining((previous) => (previous <= 1 ? 0 : previous - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [remaining])

  const resend = useCallback(async () => {
    setError(null)

    // A direct/deep navigation can reach this route without a hydrated UI
    // session. Never replace that missing identity with an empty placeholder:
    // the backend correctly rejects it as an invalid email.
    if (!sessionEmail) {
      setError(COPY.missingSession)
      return
    }

    setIsSending(true)
    const result = await authService.resendVerification({ email: sessionEmail })

    setIsSending(false)

    if (!result.ok) {
      if (result.error.code === 'EMAIL_ALREADY_VERIFIED') {
        emailVerified()
        router.replace('/(onboarding)/setup')
        return
      }
      setError(authErrorMessage(result.error.code))
      return
    }

    setRemaining(COPY.resendCooldownSeconds)
  }, [emailVerified, router, sessionEmail])

  const goToOnboarding = useCallback(
    async () => {
      setError(null)

      // Showcase mode has no mail server. Keep its explicit manual continuation
      // while requiring server authority whenever an API URL is configured.
      if (!isMockMode) {
        setIsChecking(true)
        const current = await authService.getCurrentSession()
        setIsChecking(false)

        if (!current.ok) {
          setError(authErrorMessage(current.error.code))
          return
        }

        if (!current.value.emailVerified) {
          setError(COPY.notVerified)
          return
        }
      }

      emailVerified()
      router.replace('/(onboarding)/setup')
    },
    [emailVerified, router],
  )

  const isCoolingDown = remaining > 0

  return (
    <AuthScreenLayout onBack={back} centred>
      <EnvelopeIllustration />

      <View style={styles.copy}>
        <AuthEyebrow align="center">{COPY.eyebrow}</AuthEyebrow>
        <Text variant="h2" tone="heading" align="center">
          {COPY.heading}
        </Text>
        <Text variant="body" tone="body" align="center">
          {COPY.lede}
        </Text>
      </View>

      <View style={styles.actions}>
        <AuthFormError message={error} />

        <Button
          label={COPY.resend}
          onPress={resend}
          disabled={isCoolingDown}
          loading={isSending}
          trailing={
            isCoolingDown ? (
              // `body`, NOT `onPrimary`. The countdown only ever shows while the
              // button is cooling down, which means disabled, which means the
              // fill is grey — white on that pair is 1.70:1. Body ink on it is
              // 5.48:1, the same pair the disabled label uses and the contrast
              // suite asserts.
              <Text variant="countdown" tone="body">
                {formatCooldown(remaining)}
              </Text>
            ) : undefined
          }
        />

        {/*
          The forward exit into M01. API mode confirms the session through
          `/auth/me`; showcase mode has no mail server and uses the explicit
          manual continuation described above. Replace rather than push —
          returning to "check your inbox" after pairing has begun is nonsense.
        */}
        <Button
          label={isChecking ? COPY.checking : COPY.continue}
          onPress={goToOnboarding}
          loading={isChecking}
        />

        {/*
          `outline` — a bordered card, not a flat tint. `soft` was the odd one
          out: every other secondary/back action in this module (Forgot
          Password's "Back to Sign In", Invite Partner/Invitation Sent's
          "Copy") uses `outline`, and this is the only button on this screen
          that isn't already `primary`, so it read as an unrelated third
          colour rather than "the other action" on the same screen.
        */}
        <Button label={COPY.changeEmail} onPress={back} variant="outline" />
      </View>
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  copy: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.huge,
  },
  actions: {
    gap: theme.spacing.xxl,
  },
}))
