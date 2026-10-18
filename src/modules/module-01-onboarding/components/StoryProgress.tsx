import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { Text } from '@/design-system/primitives/Text'

type StoryProgressProps = {
  step: number
  total?: number
}

/** Compact visual and spoken progress through the optional story capture flow. */
export function StoryProgress({ step, total = 7 }: StoryProgressProps) {
  const safeStep = Math.min(Math.max(step, 1), total)

  return (
    <View
      style={styles.capsule}
      accessibilityRole="progressbar"
      accessibilityLabel={`Story step ${safeStep} of ${total}`}
      accessibilityValue={{ min: 1, max: total, now: safeStep }}
    >
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, index + 1 === safeStep && styles.activeDot]}
          testID={index + 1 === safeStep ? 'story-progress-active' : undefined}
        />
      ))}
      <Text variant="caption" tone="body">
        {safeStep}/{total}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  capsule: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.hairline,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.card,
    boxShadow: theme.elevation.card,
  },
  dot: {
    width: 7,
    height: 7,
    borderWidth: 1,
    borderColor: theme.colors.border.field,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.page,
  },
  activeDot: {
    width: 11,
    height: 11,
    borderColor: theme.colors.brand.primary,
    backgroundColor: theme.colors.brand.primary,
  },
}))