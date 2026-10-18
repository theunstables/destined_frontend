import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { useBackTo } from '@/hooks/useBackTo'
import { ENTER_CODE_COPY as COPY } from '@/copy/enterPartnerCode'
import { Button } from '@/design-system/primitives/Button'
import { CodeInput } from '@/design-system/primitives/CodeInput'
import { Text } from '@/design-system/primitives/Text'
import { AuthEyebrow } from '@/modules/module-00-auth/components/AuthEyebrow'
import { AuthScreenLayout } from '@/modules/module-00-auth/components/AuthScreenLayout'
import { FloatingInfoCard } from '@/modules/module-00-auth/components/FloatingInfoCard'
import { pairingService } from '@/services/pairing'
import { useRelationshipStore } from '@/state/relationshipStore'

const CODE_LENGTH = 6

/**
 * M01-S04 — Enter Partner Code. Figma 522:461.
 *
 * A failed code is KEPT, not cleared. A six-character code is usually wrong by
 * one character, and clearing it makes the user retype the five they got right.
 */
export function EnterPartnerCodeScreen() {
  const router = useRouter()
  const { code: linkedCode } = useLocalSearchParams<{ code?: string }>()
  const back = useBackTo('/(onboarding)/setup')
  const setPartner = useRelationshipStore((state) => state.setPartner)
  const [code, setCode] = useState((linkedCode ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(0, CODE_LENGTH))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onChangeText = useCallback((next: string) => {
    setCode(next)
    // Clearing on edit, not on failure: the message describes the code that was
    // submitted, so it should survive until the user changes something.
    setError(null)
  }, [])

  const submit = useCallback(async () => {
    setSubmitting(true)
    setError(null)

    const result = await pairingService.redeemCode({ code })

    setSubmitting(false)

    if (!result.ok) {
      setError(COPY.errors[result.error.code])
      return
    }

    setPartner(result.value)
    router.push('/(onboarding)/partner-found')
  }, [code, router, setPartner])

  const goToSetup = useCallback(() => router.push('/(onboarding)/setup'), [router])

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

      <View style={styles.field}>
        <CodeInput
          label={COPY.codeLabel}
          value={code}
          onChangeText={onChangeText}
          error={error ?? undefined}
        />
        {error ? (
          <FloatingInfoCard
            icon="alert-circle"
            title={COPY.invalidTitle}
            body={COPY.invalidBody}
            tone="error"
          />
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          label={COPY.submit}
          onPress={submit}
          loading={submitting}
          disabled={code.length < CODE_LENGTH}
        />
        <Button label={COPY.needInvite} onPress={goToSetup} variant="link" />
      </View>
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  copy: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.xxxl,
  },
  field: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.huge,
  },
  actions: {
    gap: theme.spacing.md,
  },
}))
