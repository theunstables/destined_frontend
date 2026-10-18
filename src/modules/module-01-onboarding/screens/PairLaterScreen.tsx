import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { PAIR_LATER_COPY as COPY } from '@/copy/pairLater'
import { Avatar } from '@/design-system/primitives/Avatar'
import { Button } from '@/design-system/primitives/Button'
import { Text } from '@/design-system/primitives/Text'
import { useBackTo } from '@/hooks/useBackTo'
import { AuthEyebrow } from '@/modules/module-00-auth/components/AuthEyebrow'
import { AuthScreenLayout } from '@/modules/module-00-auth/components/AuthScreenLayout'
import { FloatingInfoCard } from '@/modules/module-00-auth/components/FloatingInfoCard'
import { useRelationshipStore } from '@/state/relationshipStore'

/** P12 — a deliberate confirmation that pairing remains available later. */
export function PairLaterScreen() {
  const router = useRouter()
  const back = useBackTo('/(onboarding)/setup')
  const profile = useRelationshipStore((state) => state.profile)
  const continueToStory = useCallback(() => router.push('/(onboarding)/story-begins'), [router])
  const inviteNow = useCallback(() => router.push('/(onboarding)/profile'), [router])

  return (
    <AuthScreenLayout onBack={back} centred>
      <View style={styles.hero}>
        <Avatar size={96} name={profile?.name ?? 'You'} uri={profile?.photoUri} ring />
        <View style={styles.copy}>
          <AuthEyebrow align="center">{COPY.eyebrow}</AuthEyebrow>
          <Text variant="h1" tone="heading" align="center">
            {COPY.heading}
          </Text>
          <Text variant="body" tone="body" align="center">
            {COPY.lede}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <FloatingInfoCard
          icon="heart"
          title={COPY.cardTitle}
          body={COPY.cardBody}
        />
        <Button label={COPY.continue} onPress={continueToStory} />
        <Button label={COPY.invite} onPress={inviteNow} variant="outline" />
      </View>
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  hero: {
    alignItems: 'center',
    gap: theme.spacing.xxxl,
    paddingBottom: theme.spacing.huge,
  },
  copy: {
    gap: theme.spacing.sm,
  },
  actions: {
    gap: theme.spacing.md,
  },
}))