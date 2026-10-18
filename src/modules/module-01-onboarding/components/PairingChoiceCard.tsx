import { Feather } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import { Pressable, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { Text } from '@/design-system/primitives/Text'

type PairingChoiceCardProps = {
  icon: ComponentProps<typeof Feather>['name']
  title: string
  body: string
  onPress: () => void
}

/** A full-width Floating Glass path through relationship setup. */
export function PairingChoiceCard({ icon, title, body, onPress }: PairingChoiceCardProps) {
  const { theme } = useUnistyles()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={body}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.iconWell}>
        <Feather name={icon} size={20} color={theme.colors.brand.primary} />
      </View>
      <View style={styles.copy}>
        <Text variant="labelStrong" tone="heading">
          {title}
        </Text>
        <Text variant="footnote" tone="body">
          {body}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={theme.colors.text.muted} />
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  card: {
    width: '100%',
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.hairline,
    borderRadius: theme.radii.panel,
    backgroundColor: theme.colors.surface.card,
    boxShadow: theme.elevation.card,
  },
  iconWell: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.soft,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
}))