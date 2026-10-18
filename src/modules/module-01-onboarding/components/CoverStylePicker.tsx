import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { Text } from '@/design-system/primitives/Text'
import type { CoverStyle } from '@/state/spaceStore'

type Option = { value: CoverStyle; label: string }

type CoverStylePickerProps = {
  label: string
  options: readonly Option[]
  value: CoverStyle
  onChange: (value: CoverStyle) => void
}

/** Named, visual previews ensure the cover choice never relies on color alone. */
export function CoverStylePicker({ label, options, value, onChange }: CoverStylePickerProps) {
  const { theme } = useUnistyles()

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.group}>
      <Text variant="labelStrong" tone="heading">
        {label}
      </Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[
                styles.option,
                selected && { borderColor: theme.colors.brand.primary, borderWidth: 2 },
              ]}
            >
              <LinearGradient colors={theme.colors.cover[option.value]} style={PREVIEW_FILL}>
                {selected ? (
                  <View style={styles.check}>
                    <Feather name="check" size={14} color={theme.colors.text.onPrimary} />
                  </View>
                ) : null}
              </LinearGradient>
              <Text variant="footnote" tone="heading" align="center">
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const PREVIEW_FILL = {
  width: '100%',
  height: 72,
  alignItems: 'flex-end',
  padding: 8,
} as const

const styles = StyleSheet.create((theme) => ({
  group: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  options: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  option: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.hairline,
    borderRadius: theme.radii.field,
    backgroundColor: theme.colors.surface.card,
    overflow: 'hidden',
  },
  check: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.brand.primary,
  },
}))