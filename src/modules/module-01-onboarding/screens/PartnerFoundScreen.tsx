import { useRouter } from 'expo-router'
import { useCallback, useEffect } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { useBackTo } from '@/hooks/useBackTo'
import { PARTNER_FOUND_COPY as COPY } from '@/copy/partnerFound'
import { StatusScreen } from '@/design-system/patterns/StatusScreen'
import { Avatar } from '@/design-system/primitives/Avatar'
import { Button } from '@/design-system/primitives/Button'
import { Card } from '@/design-system/primitives/Card'
import { Text } from '@/design-system/primitives/Text'
import { AuthEyebrow } from '@/modules/module-00-auth/components/AuthEyebrow'
import { AuthScreenLayout } from '@/modules/module-00-auth/components/AuthScreenLayout'
import { useRelationshipStore } from '@/state/relationshipStore'

/** Figma draws the revealed partner at 192pt with a ring. */
const AVATAR_SIZE = 192

/**
 * M01-S06 — Partner Found. Figma 522:709.
 *
 * A full screen rather than a sheet (D37). Its frame is 390×613 with its own
 * background, which reads as a sheet, but it is reached by redeeming an invite
 * and has no parent screen to sit over.
 */
export function PartnerFoundScreen() {
  const router = useRouter()
  const back = useBackTo('/(onboarding)/setup')
  const partner = useRelationshipStore((state) => state.partner)

  const goToEnterCode = useCallback(
    // replace, not push: there is nothing on this screen worth returning to
    // once the partner has been rejected.
    () => router.replace('/(onboarding)/enter-code'),
    [router],
  )

  useEffect(() => {
    // Reachable with an empty store by deep link, or by a reload on web. There
    // is no partner to show, so send them back to find one rather than render
    // an anonymous circle.
    if (!partner) goToEnterCode()
  }, [partner, goToEnterCode])

  const goToConfirm = useCallback(() => router.push('/(onboarding)/confirm-partner'), [router])

  if (!partner) return null

  return (
    <AuthScreenLayout onBack={back} centred>
      <View style={styles.eyebrow}>
        <AuthEyebrow align="center">{COPY.eyebrow}</AuthEyebrow>
      </View>
      <StatusScreen
        illustration={
          <Card>
            <View style={styles.avatar}>
              <Avatar size={AVATAR_SIZE} name={partner.name} uri={partner.photoUri} ring />
              <Text variant="labelStrong" tone="heading" align="center">
                {partner.name}
              </Text>
              <Text variant="footnote" tone="body" align="center">
                One private world for two.
              </Text>
            </View>
          </Card>
        }
        heading={COPY.heading}
        lede={COPY.lede(partner.name)}
        actions={
          <>
            <Button label={COPY.confirm} onPress={goToConfirm} />
            <Button label={COPY.reject} onPress={goToEnterCode} variant="link" />
          </>
        }
      />
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  eyebrow: {
    paddingBottom: theme.spacing.lg,
  },
  avatar: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
}))
