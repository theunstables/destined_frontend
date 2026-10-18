import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { RELATIONSHIP_CONNECTED_COPY as COPY } from '@/copy/relationshipConnected'
import { StatusScreen } from '@/design-system/patterns/StatusScreen'
import { Avatar } from '@/design-system/primitives/Avatar'
import { Button } from '@/design-system/primitives/Button'
import { Card } from '@/design-system/primitives/Card'
import { Text } from '@/design-system/primitives/Text'
import { AuthEyebrow } from '@/modules/module-00-auth/components/AuthEyebrow'
import { AuthScreenLayout } from '@/modules/module-00-auth/components/AuthScreenLayout'
import { useRelationshipStore } from '@/state/relationshipStore'

/**
 * M01-S08 — Relationship Connected. Figma 522:802.
 *
 * M01-S10 Relationship Confirmation was retired as a duplicate of this screen
 * (D30). Its ID is never reused.
 */
export function RelationshipConnectedScreen() {
  const router = useRouter()
  const partner = useRelationshipStore((state) => state.partner)
  const profile = useRelationshipStore((state) => state.profile)

  const goToStoryBegins = useCallback(
    // replace: pairing is done, so every screen behind this one is spent and
    // going back to a confirmation for a committed relationship is nonsense.
    () => router.replace('/(onboarding)/story-begins'),
    [router],
  )

  return (
    <AuthScreenLayout centred>
      <View style={styles.eyebrow}>
        <AuthEyebrow align="center">{COPY.eyebrow}</AuthEyebrow>
      </View>
      <StatusScreen
        illustration={
          <Card>
            <View style={styles.pair}>
              <Avatar size={88} name={profile?.name || 'You'} uri={profile?.photoUri} ring />
              <Text variant="h2" tone="brand">♡</Text>
              <Avatar size={88} name={partner?.name || 'Partner'} uri={partner?.photoUri} ring />
            </View>
          </Card>
        }
        heading={COPY.heading}
        lede={COPY.lede}
        actions={<Button label={COPY.confirm} onPress={goToStoryBegins} />}
      />
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  eyebrow: {
    paddingBottom: theme.spacing.lg,
  },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
}))
