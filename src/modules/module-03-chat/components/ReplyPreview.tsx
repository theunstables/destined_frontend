import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { StyleSheet } from 'react-native-unistyles'

import { useEntrance } from '@/design-system/patterns/useEntrance'
import { IconButton } from '@/design-system/patterns/IconButton'
import { CHAT_COPY } from '@/copy/chat'
import { Text } from '@/design-system/primitives/Text'

type Props = {
  body: string
  partnerName?: string
  onCancel: () => void
}

/**
 * The quoted-message strip that sits above the composer while replying.
 *
 * Its ground is `surface.field` — a normal surface, not a chat bubble — so the
 * quoted body takes `Text`'s default `body` tone rather than the `onChat` tone
 * `MessageBubble` uses. `onChat` is contrast-checked against `bubbleOutgoing` /
 * `bubbleIncoming` / `accentSoft` only (see `Text.tsx`); it has no guarantee
 * here and would be the wrong tone to reach for.
 *
 * Truncation (`numberOfLines`) passes straight through `Text`'s `...rest` —
 * `TextProps` omits only `style`, not RN's other passthrough props — but the
 * flex that lets the body actually shrink to one line has to live on a
 * wrapping `View`: `Text` has no `style` prop to carry `flex: 1` itself.
 *
 * The attribution line uses the paired partner name passed down by the
 * conversation screen, while retaining the mock persona as a component default.
 */
export function ReplyPreview({
  body,
  partnerName = CHAT_COPY.home.defaultPartnerName,
  onCancel,
}: Props) {
  // This strip appears above the composer the instant a reply starts, and
  // pushes the composer down as it does. Rising into place makes that shove
  // read as one movement instead of a jump.
  const entrance = useEntrance()

  return (
    <Animated.View entering={entrance.rise} exiting={entrance.fadeOut} style={styles.wrap}>
      <View style={styles.bar} />
      <View style={styles.body}>
        <Text variant="footnote" tone="placeholder" numberOfLines={1}>
          {CHAT_COPY.conversation.replyingToPartner(partnerName)}
        </Text>
        <Text numberOfLines={1}>{body}</Text>
      </View>
      {/* Was a bare icon with no padding around it — a 18pt tap target. */}
      <IconButton icon="x" label="Cancel reply" onPress={onCancel} size="sm" tone="plain" />
    </Animated.View>
  )
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface.field,
  },
  bar: { width: 3, height: 28, borderRadius: 2, backgroundColor: theme.colors.chat.accent },
  // Only place doing layout for the quoted text — `Text` itself cannot.
  body: { flex: 1 },
}))
