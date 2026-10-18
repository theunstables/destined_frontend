import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { RELATIONSHIP_SETUP_COPY as COPY } from '@/copy/relationshipSetup'
import { Text } from '@/design-system/primitives/Text'
import { AuthEyebrow } from '@/modules/module-00-auth/components/AuthEyebrow'
import { AuthScreenLayout } from '@/modules/module-00-auth/components/AuthScreenLayout'
import { PairingChoiceCard } from '@/modules/module-01-onboarding/components/PairingChoiceCard'

/**
 * M01-S01 — Relationship Setup. Figma 522:302.
 *
 * The fork of the whole cluster: invite someone, redeem someone's invite, or
 * neither. Profile creation sits on the invite branch only — the person
 * entering a code is identified by the invite they redeem (spec §8).
 *
 * Reuses `AuthScreenLayout` rather than introducing an onboarding chrome: the
 * content column, insets and scroll behaviour are identical, and the drawn
 * 350pt column is exactly its inset (spec §6).
 */
export function RelationshipSetupScreen() {
  const router = useRouter()

  const goToProfile = useCallback(() => router.push('/(onboarding)/profile'), [router])
  const goToEnterCode = useCallback(() => router.push('/(onboarding)/enter-code'), [router])
  const goToPairLater = useCallback(() => router.push('/(onboarding)/pair-later'), [router])

  return (
    <AuthScreenLayout centred>
      <View style={styles.copy}>
        <AuthEyebrow align="center">{COPY.eyebrow}</AuthEyebrow>
        <Text variant="h1" tone="heading" align="center">
          {COPY.heading}
        </Text>
        <Text variant="body" tone="body" align="center">
          {COPY.lede}
        </Text>
      </View>

      <View style={styles.actions}>
        <PairingChoiceCard
          icon="send"
          title={COPY.invite}
          body={COPY.inviteBody}
          onPress={goToProfile}
        />
        <PairingChoiceCard
          icon="hash"
          title={COPY.haveCode}
          body={COPY.haveCodeBody}
          onPress={goToEnterCode}
        />
        <PairingChoiceCard
          icon="heart"
          title={COPY.later}
          body={COPY.laterBody}
          onPress={goToPairLater}
        />
      </View>
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  copy: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xxxl,
  },
  actions: {
    gap: theme.spacing.md,
  },
}))
