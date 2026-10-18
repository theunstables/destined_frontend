import { Feather } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Pressable, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { TIMELINE_COPY as COPY } from '@/copy/timeline'
import { Text } from '@/design-system/primitives/Text'
import type { TimelineItem } from '@/services/timeline'
import { formatDate } from '@/utils/formatStoryDate'

const TYPE_ICON: Record<TimelineItem['type'], keyof typeof Feather.glyphMap> = {
  memory: 'heart',
  calendar: 'calendar',
  story: 'book-open',
  occasion: 'star',
}

type Props = {
  item: TimelineItem
  onPress?: (item: TimelineItem) => void
}

/** One server-authored moment on the couple's chronological story rail. */
export function TimelineItemCard({ item, onPress }: Props) {
  const { theme } = useUnistyles()
  const content = (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={styles.marker}>
          <Feather name={TYPE_ICON[item.type]} size={16} color={theme.colors.brand.primary} />
        </View>
        <View style={styles.line} />
      </View>

      <View style={styles.card}>
        <View style={styles.meta}>
          <Text variant="caption" tone="brand">
            {COPY.types[item.type]}
          </Text>
          <Text variant="footnote" tone="muted">
            {formatDate(item.date)}
          </Text>
        </View>

        {item.mediaUrl ? (
          <Image
            source={{ uri: item.mediaUrl }}
            style={{
              width: '100%',
              height: 176,
              borderRadius: theme.radii.field,
              backgroundColor: theme.colors.surface.field,
            }}
            contentFit="cover"
            transition={200}
            testID={`timeline-media-${item.id}`}
          />
        ) : null}

        <Text variant="h3" tone="heading">
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text variant="footnote" tone="body">
            {item.subtitle}
          </Text>
        ) : null}

        {onPress ? (
          <View style={styles.openRow}>
            <Text variant="footnote" tone="brand">
              {COPY.openMoment}
            </Text>
            <Feather name="arrow-up-right" size={16} color={theme.colors.brand.primary} />
          </View>
        ) : null}
      </View>
    </View>
  )

  if (!onPress) return content

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${COPY.types[item.type]}, ${formatDate(item.date)}`}
    >
      {content}
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  rail: {
    width: 32,
    alignItems: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.surface.card,
  },
  line: {
    flex: 1,
    width: 1,
    minHeight: theme.spacing.xxl,
    backgroundColor: theme.colors.border.subtle,
  },
  card: {
    flex: 1,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.xl,
    borderRadius: theme.radii.field,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.surface.card,
    boxShadow: theme.elevation.card,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
}))