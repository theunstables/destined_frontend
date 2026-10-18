import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { TIMELINE_COPY as COPY } from '@/copy/timeline'
import { AppScreenLayout } from '@/design-system/patterns/AppScreenLayout'
import { StatusScreen } from '@/design-system/patterns/StatusScreen'
import { Button } from '@/design-system/primitives/Button'
import { Text } from '@/design-system/primitives/Text'
import { useBackTo } from '@/hooks/useBackTo'
import { TimelineItemCard } from '@/modules/module-04-timeline/components/TimelineItemCard'
import { timelineService, type TimelineItem } from '@/services/timeline'
import { useTimelineStore } from '@/state/timelineStore'

/** T01 — the server-sourced relationship timeline with explicit cursor paging. */
export function TimelineScreen() {
  const router = useRouter()
  const back = useBackTo('/(app)/home')
  const items = useTimelineStore((state) => state.items)
  const nextCursor = useTimelineStore((state) => state.nextCursor)
  const hydrated = useTimelineStore((state) => state.hydrated)
  const hydrate = useTimelineStore((state) => state.hydrate)
  const append = useTimelineStore((state) => state.append)
  const [loading, setLoading] = useState(!hydrated)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestInFlight = useRef(false)

  const load = useCallback(async () => {
    if (requestInFlight.current) return

    requestInFlight.current = true
    setLoading(true)
    setError(null)
    const result = await timelineService.list()
    requestInFlight.current = false
    setLoading(false)

    if (result.ok) hydrate(result.value)
    else setError(COPY.errors[result.error.code])
  }, [hydrate])

  useEffect(() => {
    if (!hydrated) void load()
  }, [hydrated, load])

  const loadMore = useCallback(async () => {
    if (!nextCursor || requestInFlight.current) return

    requestInFlight.current = true
    setLoadingMore(true)
    setError(null)
    const result = await timelineService.list({ cursor: nextCursor })
    requestInFlight.current = false
    setLoadingMore(false)

    if (result.ok) append(result.value)
    else setError(COPY.olderError)
  }, [append, nextCursor])

  const openItem = useCallback((item: TimelineItem) => {
    if (item.type === 'memory') {
      router.push(`/(app)/memories/${item.id}`)
      return
    }

    router.push({ pathname: '/(app)/occasions/[key]', params: { key: item.id } })
  }, [router])

  if (loading && !hydrated) {
    return <AppScreenLayout activeTab="home" onBack={back} />
  }

  if (!hydrated && error) {
    return (
      <AppScreenLayout activeTab="home" onBack={back}>
        <StatusScreen
          eyebrow={COPY.eyebrow}
          heading={error}
          actions={<Button label={COPY.retry} onPress={load} />}
        />
      </AppScreenLayout>
    )
  }

  return (
    <AppScreenLayout activeTab="home" onBack={back}>
      <View style={styles.head}>
        <Text variant="caption" tone="brand" align="center">
          {COPY.eyebrow}
        </Text>
        <Text variant="h1" tone="heading" align="center">
          {COPY.heading}
        </Text>
        <Text variant="body" tone="body" align="center">
          {COPY.lede}
        </Text>
      </View>

      {items.length === 0 ? (
        <StatusScreen
          heading={COPY.empty.heading}
          lede={COPY.empty.lede}
          actions={(
            <Button
              label={COPY.empty.action}
              onPress={() => router.push('/(app)/memories/new')}
            />
          )}
        />
      ) : (
        <View style={styles.timeline}>
          {items.map((item) => (
            <TimelineItemCard
              key={`${item.type}-${item.id}`}
              item={item}
              onPress={item.type === 'story' ? undefined : openItem}
            />
          ))}
        </View>
      )}

      {error && hydrated ? (
        <Text variant="footnote" tone="error" align="center" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {nextCursor ? (
        <Button
          label={COPY.loadMore}
          onPress={loadMore}
          variant="outline"
          loading={loadingMore}
          disabled={loadingMore}
        />
      ) : null}
    </AppScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  head: {
    gap: theme.spacing.sm,
  },
  timeline: {
    gap: 0,
  },
}))