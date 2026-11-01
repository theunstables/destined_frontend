import { useEffect, useRef, useState } from 'react'
import { Platform, View } from 'react-native'
import { useRouter } from 'expo-router'
import { isMockMode } from '@/config/env'
import { SocialButton } from '@/design-system/patterns/SocialButton'
import { Text } from '@/design-system/primitives/Text'
import { appleEnabled, appleSignIn } from '@/services/auth/apple'
import { isApiError } from '@/services/http/errors'
import { useSessionStore } from '@/state/sessionStore'

export function AppleSignInButton({ link = false }: { link?: boolean }) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linked, setLinked] = useState(false)
  const pending = useRef(false)

  useEffect(() => {
    if (isMockMode) return
    let active = true
    void appleEnabled().then((value) => { if (active) setEnabled(value) }).catch(() => { if (active) setEnabled(false) })
    return () => { active = false }
  }, [])

  const signIn = async () => {
    if (pending.current || !enabled) return
    pending.current = true
    setBusy(true)
    setError(null)
    try {
      const session = await appleSignIn(link)
      if (session) {
        useSessionStore.getState().signedIn(session)
        if (link) setLinked(true)
        else router.replace(session.emailVerified ? '/(onboarding)/setup' : '/(auth)/verify-email')
      } else if (Platform.OS !== 'web' && !link) router.replace('/(auth)/sign-in')
    } catch (failure) {
      setError(isApiError(failure) && failure.code === 'ACCOUNT_CONFLICT'
        ? link ? 'That Apple account is already connected to another account.'
          : 'Sign into your existing account, then connect Apple in Security settings.'
        : 'Apple sign-in could not complete. Check popup permissions and try again.')
      if (Platform.OS !== 'web' && !link) router.replace('/(auth)/sign-in')
    } finally {
      pending.current = false
      setBusy(false)
      if (Platform.OS !== 'web' && link) router.replace('/(app)/settings/security')
    }
  }

  return (
    <View style={{ width: '100%', gap: 8 }}>
      <SocialButton provider="apple" onPress={() => { void signIn() }} disabled={!enabled || busy}
        label={busy ? 'Connecting...' : link ? 'Connect Apple' : 'Continue with Apple'} />
      {error ? <Text variant="footnote" tone="error" accessibilityRole="alert">{error}</Text> : null}
      {linked ? <Text variant="footnote" tone="success" accessibilityLiveRegion="polite">Apple connected.</Text> : null}
    </View>
  )
}