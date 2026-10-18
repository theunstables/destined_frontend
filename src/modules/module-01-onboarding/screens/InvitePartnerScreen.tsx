import { useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { useCallback, useEffect, useState } from 'react'
import { Share, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { useBackTo } from '@/hooks/useBackTo'
import { INVITE_PARTNER_COPY as COPY } from '@/copy/invitePartner'
import { Button } from '@/design-system/primitives/Button'
import { Text } from '@/design-system/primitives/Text'
import { AuthEyebrow } from '@/modules/module-00-auth/components/AuthEyebrow'
import { AuthScreenLayout } from '@/modules/module-00-auth/components/AuthScreenLayout'
import { FloatingInfoCard } from '@/modules/module-00-auth/components/FloatingInfoCard'
import { PairingCodeCard } from '@/modules/module-01-onboarding/components/PairingCodeCard'
import { pairingService } from '@/services/pairing'
import { useRelationshipStore } from '@/state/relationshipStore'

/**
 * M01-S03 — Invite Your Partner. Figma 522:422.
 *
 * The code is issued on mount rather than behind a button: the screen has
 * nothing to show without one, so a user would only ever press it.
 *
 * Both actions advance to M01-S05, which shows the same code — sharing does not
 * consume it, and someone who shares still needs somewhere to wait.
 */
export function InvitePartnerScreen() {
  const router = useRouter()
  const back = useBackTo('/(onboarding)/setup')
  const code = useRelationshipStore((state) => state.code)
  const setInvite = useRelationshipStore((state) => state.setInvite)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function issue() {
      const result = await pairingService.createInvite()

      if (cancelled) return

      if (!result.ok) {
        setFormError(COPY.errors[result.error.code])
        return
      }

      setInvite(result.value.code)
    }

    void issue()

    // The screen can unmount mid-request; setting state afterwards would warn
    // and, worse, resurrect an invite the user already navigated away from.
    return () => {
      cancelled = true
    }
  }, [setInvite])

  const onShare = useCallback(async () => {
    if (!code) return

    await Share.share({ message: COPY.shareMessage(code) })
    router.push('/(onboarding)/invitation-sent')
  }, [code, router])

  /*
   * Copies for real, then advances.
   *
   * This used to advance WITHOUT copying — the worst of the three shapes a
   * missing dependency can take, because the screen said "copied" and the
   * clipboard held whatever was there before.
   */
  const onCopy = useCallback(async () => {
    if (code) await Clipboard.setStringAsync(code)

    router.push('/(onboarding)/invitation-sent')
  }, [code, router])

  return (
    <AuthScreenLayout onBack={back} centred>
      <View style={styles.copy}>
        <AuthEyebrow align="center">{COPY.eyebrow}</AuthEyebrow>
        <Text variant="h1" tone="heading" align="center">
          {COPY.heading}
        </Text>
        <Text variant="body" tone="body" align="center">
          {COPY.lede}
        </Text>
      </View>

      <View style={styles.code}>
        <PairingCodeCard label={COPY.codeLabel} code={code} status={COPY.codeStatus} />
      </View>

      {formError ? (
        <FloatingInfoCard
          icon="alert-circle"
          title="Invitation not created"
          body={formError}
          tone="error"
        />
      ) : null}

      <View style={styles.actions}>
        <Button label={COPY.share} onPress={onShare} disabled={!code} />
        <Button label={COPY.copy} onPress={onCopy} variant="outline" disabled={!code} />
      </View>
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  copy: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xxxl,
  },
  code: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.huge,
  },
  actions: {
    gap: theme.spacing.md,
  },
}))
