import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { AccessibilityInfo, Platform, View, type ScrollView, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useUnistyles } from 'react-native-unistyles'
import { usePreferencesStore } from '@/state/preferencesStore'

export type RevealEffect = 'fade' | 'rise' | 'zoom' | 'flip'
export type ViewportFrame = { x: number; y: number; width: number; height: number }
type Measurable = { measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void }
type Watch = { node: Measurable; reveal: () => void }
type Viewport = { observe: (watch: Watch) => () => void; check: () => void }
const RevealViewport = createContext<Viewport | null>(null)
const useClientLayoutEffect = Platform.OS === 'web' && typeof window !== 'undefined' ? useLayoutEffect : useEffect
const hasMeasureInWindow = (value: unknown): value is Measurable =>
  !!value && typeof value === 'object' && 'measureInWindow' in value && typeof (value as Measurable).measureInWindow === 'function'

export function intersectsViewport(item: ViewportFrame, viewport: ViewportFrame): boolean {
  if ([item, viewport].some((frame) => ![frame.x, frame.y, frame.width, frame.height].every(Number.isFinite)
    || frame.width <= 0 || frame.height <= 0)) return false
  const inset = Math.min(24, viewport.height / 4)
  return item.x < viewport.x + viewport.width && item.x + item.width > viewport.x
    && item.y < viewport.y + viewport.height - inset && item.y + item.height > viewport.y
}

export function observeWebReveal(element: Element, reveal: () => void): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    reveal()
    return () => {}
  }
  let observer: IntersectionObserver | undefined
  try {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer?.disconnect()
        reveal()
      }
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' })
    observer.observe(element)
  } catch {
    observer?.disconnect()
    reveal()
  }
  return () => observer?.disconnect()
}

export function useRevealViewport(scroll: RefObject<ScrollView | null>): Viewport {
  const watches = useRef(new Set<Watch>())
  const frame = useRef<number | null>(null)
  const mounted = useRef(true)
  const check = useCallback(() => {
    if (Platform.OS === 'web' || !mounted.current || frame.current !== null || watches.current.size === 0) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      if (!mounted.current) return
      const root = scroll.current?.getNativeScrollRef?.() ?? scroll.current
      if (!hasMeasureInWindow(root)) {
        for (const watch of watches.current) watch.reveal()
        watches.current.clear()
        return
      }
      root.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (!mounted.current || width <= 0 || height <= 0) return
        for (const watch of watches.current) {
          if (!hasMeasureInWindow(watch.node)) {
            watches.current.delete(watch)
            watch.reveal()
            continue
          }
          watch.node.measureInWindow((itemX: number, itemY: number, itemWidth: number, itemHeight: number) => {
            if (!mounted.current || !watches.current.has(watch)) return
            if (intersectsViewport({ x: itemX, y: itemY, width: itemWidth, height: itemHeight }, { x, y, width, height })) {
              watches.current.delete(watch)
              watch.reveal()
            }
          })
        }
      })
    })
  }, [scroll])

  const observe = useCallback((watch: Watch) => {
    watches.current.add(watch)
    check()
    return () => { watches.current.delete(watch) }
  }, [check])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
      watches.current.clear()
    }
  }, [])
  return useMemo(() => ({ observe, check }), [observe, check])
}

export function ScrollRevealProvider({ viewport, children }: { viewport: Viewport; children: ReactNode }) {
  return <RevealViewport.Provider value={viewport}>{children}</RevealViewport.Provider>
}

type Props = {
  children: ReactNode
  effect?: RevealEffect
  delay?: number
  style?: StyleProp<ViewStyle>
  disabled?: boolean
  testID?: string
}

export function ScrollReveal({ children, effect = 'rise', delay = 0, style, disabled = false, testID }: Props) {
  const { theme } = useUnistyles()
  const appReduced = usePreferencesStore((state) => state.reduceMotion)
  const initialReduced = useReducedMotion()
  const [systemReduced, setSystemReduced] = useState(initialReduced)
  const reduced = disabled || appReduced || systemReduced
  const viewport = useContext(RevealViewport)
  const target = useRef<View>(null)
  const progress = useSharedValue(1)
  const revealed = useRef(false)
  const unsubscribe = useRef<(() => void) | null>(null)
  const duration = theme.motion.duration.slow
  const curve = theme.motion.curve.decelerate
  const stagger = Math.max(0, Math.min(160, delay))

  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduced)
    return () => subscription.remove()
  }, [])

  useEffect(() => () => cancelAnimation(progress), [progress])

  const reveal = useCallback(() => {
    if (revealed.current) return
    revealed.current = true
    unsubscribe.current?.()
    unsubscribe.current = null
    progress.set(withDelay(stagger, withTiming(1, {
      duration, easing: Easing.bezier(...curve), reduceMotion: ReduceMotion.System,
    }), ReduceMotion.System))
  }, [curve, duration, progress, stagger])

  const showImmediately = useCallback(() => {
    revealed.current = true
    unsubscribe.current?.()
    unsubscribe.current = null
    cancelAnimation(progress)
    progress.set(1)
  }, [progress])

  useClientLayoutEffect(() => {
    if (reduced) {
      showImmediately()
      return
    }
    if (revealed.current) return
    const node = target.current
    if (!node) return
    if (Platform.OS === 'web') {
      if (typeof IntersectionObserver === 'undefined') return
      progress.set(0)
      unsubscribe.current = observeWebReveal(node as unknown as Element, reveal)
    } else if (viewport) {
      progress.set(0)
      unsubscribe.current = viewport.observe({ node, reveal })
    }
    return () => {
      unsubscribe.current?.()
      unsubscribe.current = null
    }
  }, [progress, reduced, reveal, showImmediately, viewport])

  const animated = useAnimatedStyle(() => {
    const remaining = 1 - progress.get()
    return {
      opacity: progress.get(),
      transform: [
        { perspective: 900 },
        { translateY: effect === 'rise' ? remaining * 16 : 0 },
        { scale: effect === 'zoom' ? 1 - remaining * 0.045 : 1 },
        { rotateX: `${effect === 'flip' ? remaining * -12 : 0}deg` },
      ],
    }
  }, [effect])

  return (
    <Animated.View ref={target} collapsable={false} testID={testID} style={[style, animated]}
      onLayout={() => viewport?.check()} onTouchStart={showImmediately}
      {...(Platform.OS === 'web' ? { onFocus: showImmediately, onFocusCapture: showImmediately } : {})}>
      {children}
    </Animated.View>
  )
}