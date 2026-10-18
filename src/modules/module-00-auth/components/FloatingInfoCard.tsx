import { Feather } from '@expo/vector-icons'
import { View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { Text } from '@/design-system/primitives/Text'

type FloatingInfoCardProps = {
  icon: 'lock' | 'mail' | 'alert-circle' | 'check-circle'
  title: string
  body: string
  tone?: 'brand' | 'error' | 'success'
}

/** A compact glass-like assurance/status surface used by the auth state flow. */
export function FloatingInfoCard({
  icon,
  title,
  body,
  tone = 'brand',
}: FloatingInfoCardProps) {
  const { theme } = useUnistyles()
  styles.useVariants({ tone })
  const color = tone === 'error'
    ? theme.colors.feedback.error
    : tone === 'success'
      ? theme.colors.feedback.success
      : theme.colors.brand.primary

  return (
    <View style={styles.card} accessibilityRole={tone === 'error' ? 'alert' : undefined}>
      <View style={styles.iconWell}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <View style={styles.copy}>
        <Text variant="labelStrong" tone={tone === 'brand' ? 'heading' : tone}>
          {title}
        </Text>
        <Text variant="footnote" tone="body">
          {body}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.hairline,
    borderRadius: theme.radii.panel,
    backgroundColor: theme.colors.surface.card,
    boxShadow: theme.elevation.card,
    variants: {
      tone: {
        brand: {},
        error: { borderColor: theme.colors.feedback.error },
        success: { borderColor: theme.colors.feedback.success },
      },
    },
  },
  iconWell: {
    width: 40,
    height: 40,
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