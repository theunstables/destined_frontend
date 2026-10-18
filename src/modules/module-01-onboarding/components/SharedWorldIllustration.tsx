import { Feather } from '@expo/vector-icons'
import { View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { Avatar } from '@/design-system/primitives/Avatar'
import { useRelationshipStore } from '@/state/relationshipStore'

/** A native two-person world built from real flow data rather than sample memories. */
export function SharedWorldIllustration() {
  const { theme } = useUnistyles()
  const profile = useRelationshipStore((state) => state.profile)
  const partner = useRelationshipStore((state) => state.partner)

  return (
    <View
      style={styles.world}
      accessibilityLabel="Your shared world"
      accessibilityRole="image"
    >
      <View style={styles.orbit} />
      <View style={[styles.spark, styles.sparkLeft]} />
      <View style={[styles.spark, styles.sparkRight]} />
      <View style={styles.people}>
        <Avatar size={72} name={profile?.name || 'You'} uri={profile?.photoUri} ring />
        <View style={styles.heart}>
          <Feather name="heart" size={20} color={theme.colors.brand.primary} />
        </View>
        <Avatar size={72} name={partner?.name || 'Partner'} uri={partner?.photoUri} ring />
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  world: {
    width: 264,
    height: 184,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.hairline,
    borderRadius: theme.radii.medallion,
    backgroundColor: theme.colors.surface.soft,
    boxShadow: theme.elevation.medallion,
    overflow: 'hidden',
  },
  orbit: {
    position: 'absolute',
    width: 220,
    height: 116,
    borderWidth: 1,
    borderColor: theme.colors.brand.primary,
    borderRadius: theme.radii.pill,
    transform: [{ rotate: '-8deg' }],
    opacity: 0.35,
  },
  people: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  heart: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.card,
  },
  spark: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.accents[0].soft,
  },
  sparkLeft: {
    top: 28,
    left: 42,
  },
  sparkRight: {
    right: 36,
    bottom: 28,
  },
}))