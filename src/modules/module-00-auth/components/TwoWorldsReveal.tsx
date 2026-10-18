import { Feather } from '@expo/vector-icons'
import { useCallback, useEffect } from 'react'
import { Pressable, View } from 'react-native'
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { WELCOME_COPY } from '@/copy/welcome'
import { Text } from '@/design-system/primitives/Text'

const clamp = Extrapolation.CLAMP

/**
 * The finalized brand idea rendered natively: two complete worlds meet and
 * become one shared world before the product name is revealed.
 *
 * This is real app UI, not an embedded HTML animation. Reduced-motion users
 * receive the settled shared-world composition immediately.
 */
export function TwoWorldsReveal() {
  const { theme } = useUnistyles()
  const reducedMotion = useReducedMotion()
  const progress = useSharedValue(reducedMotion ? 1 : 0)

  const play = useCallback(() => {
    progress.value = reducedMotion ? 1 : 0
    if (!reducedMotion) {
      progress.value = withTiming(1, {
        duration: 5600,
        easing: Easing.bezier(0.22, 0.8, 0.22, 1),
      })
    }
  }, [progress, reducedMotion])

  useEffect(() => {
    play()
  }, [play])

  const leftStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 0.46, 0.55], [0, 1, 1, 0], clamp),
    transform: [
      { translateX: interpolate(progress.value, [0, 0.12, 0.46], [-110, -76, 43], clamp) },
      { scale: interpolate(progress.value, [0, 0.15, 0.46, 0.55], [0.7, 0.82, 1, 0.7], clamp) },
      { rotate: `${interpolate(progress.value, [0, 0.46], [-14, 0], clamp)}deg` },
    ],
  }))

  const rightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 0.46, 0.55], [0, 1, 1, 0], clamp),
    transform: [
      { translateX: interpolate(progress.value, [0, 0.12, 0.46], [110, 76, -43], clamp) },
      { scale: interpolate(progress.value, [0, 0.15, 0.46, 0.55], [0.7, 0.82, 1, 0.7], clamp) },
      { rotate: `${interpolate(progress.value, [0, 0.46], [14, 0], clamp)}deg` },
    ],
  }))

  const collisionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.43, 0.48, 0.57], [0, 1, 0], clamp),
    transform: [{ scale: interpolate(progress.value, [0.43, 0.49, 0.57], [0.1, 1, 3.2], clamp) }],
  }))

  const sharedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.49, 0.59], [0, 1], clamp),
    transform: [
      { scale: interpolate(progress.value, [0.49, 0.61, 0.75], [0.15, 1.08, 0.86], clamp) },
      { rotate: `${interpolate(progress.value, [0.49, 0.68], [-18, 0], clamp)}deg` },
    ],
  }))

  const copyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.7, 0.82], [0, 1], clamp),
    transform: [{ translateY: interpolate(progress.value, [0.7, 0.84], [18, 0], clamp) }],
  }))

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Replay the two worlds becoming one"
      onPress={play}
      style={styles.stage}
      testID="two-worlds-reveal"
    >
      <View style={styles.ambientLeft} />
      <View style={styles.ambientRight} />

      <View style={styles.worldArea} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View style={[styles.world, styles.leftWorld, leftStyle]}>
          <View style={styles.leftOrbit} />
          <View style={styles.leftLand} />
        </Animated.View>

        <Animated.View style={[styles.world, styles.rightWorld, rightStyle]}>
          <View style={styles.rightOrbit} />
          <View style={styles.rightLand} />
        </Animated.View>

        <Animated.View style={[styles.collision, collisionStyle]} />

        <Animated.View style={[styles.sharedWorld, sharedStyle]}>
          <View style={styles.sharedOrbitOne} />
          <View style={styles.sharedOrbitTwo} />
          <View style={styles.sharedLand} />
          <View style={styles.heartDisc}>
            <Feather name="heart" size={26} color={theme.colors.brand.primary} />
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.copy, copyStyle]}>
        <Text variant="caption" tone="brand" align="center">
          {WELCOME_COPY.eyebrow}
        </Text>
        <Text variant="display" tone="heading" align="center">
          {WELCOME_COPY.headlineLines[0]}
        </Text>
        <Text variant="footnote" tone="body" align="center">
          {WELCOME_COPY.subtitleLines[0]}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  stage: {
    width: '100%',
    flex: 1,
    minHeight: 390,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientLeft: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    left: -95,
    top: 20,
    backgroundColor: theme.colors.surface.glow,
  },
  ambientRight: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -120,
    bottom: 0,
    backgroundColor: theme.colors.surface.wash,
  },
  worldArea: {
    width: 290,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  world: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 69,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.hairline,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.34,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  leftWorld: {
    left: 0,
    backgroundColor: theme.colors.cover.dawn[1],
  },
  rightWorld: {
    right: 0,
    backgroundColor: theme.colors.cover.night[0],
  },
  leftOrbit: {
    position: 'absolute',
    width: 86,
    height: 38,
    borderWidth: 1,
    borderColor: theme.colors.border.hairline,
    borderRadius: 43,
    left: 25,
    top: 49,
    transform: [{ rotate: '-27deg' }],
  },
  rightOrbit: {
    position: 'absolute',
    width: 86,
    height: 38,
    borderWidth: 1,
    borderColor: theme.colors.border.hairline,
    borderRadius: 43,
    left: 25,
    top: 49,
    transform: [{ rotate: '27deg' }],
  },
  leftLand: {
    position: 'absolute',
    width: 48,
    height: 34,
    borderRadius: 18,
    left: 25,
    bottom: 28,
    backgroundColor: theme.colors.surface.wash,
    transform: [{ rotate: '24deg' }],
  },
  rightLand: {
    position: 'absolute',
    width: 48,
    height: 34,
    borderRadius: 18,
    right: 23,
    top: 28,
    backgroundColor: theme.colors.surface.glow,
    transform: [{ rotate: '-23deg' }],
  },
  collision: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.text.heading,
    shadowColor: theme.colors.brand.primary,
    shadowOpacity: 0.9,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  sharedWorld: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brand.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.hairline,
    shadowColor: theme.colors.brand.primary,
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  sharedOrbitOne: {
    position: 'absolute',
    width: 124,
    height: 58,
    borderWidth: 1,
    borderColor: theme.colors.border.hairline,
    borderRadius: 62,
    transform: [{ rotate: '24deg' }],
  },
  sharedOrbitTwo: {
    position: 'absolute',
    width: 104,
    height: 46,
    borderWidth: 1,
    borderColor: theme.colors.border.hairline,
    borderRadius: 52,
    transform: [{ rotate: '-38deg' }],
  },
  sharedLand: {
    position: 'absolute',
    width: 92,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.strength.weak,
    opacity: 0.34,
    transform: [{ rotate: '18deg' }],
  },
  heartDisc: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface.card,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  copy: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
}))