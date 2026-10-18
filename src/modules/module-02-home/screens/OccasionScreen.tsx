import { Feather } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { useBackTo } from '@/hooks/useBackTo'
import { OCCASION_COPY as COPY } from '@/copy/occasion'
import { AppScreenLayout } from '@/design-system/patterns/AppScreenLayout'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Button } from '@/design-system/primitives/Button'
import { Text } from '@/design-system/primitives/Text'
import { dateInDays, findComingUp, isBirthday } from '@/modules/module-02-home/comingUp'
import { MemoryCard } from '@/modules/module-03-memories/components/MemoryCard'
import { PhotoMemoryCard } from '@/modules/module-03-memories/components/PhotoMemoryCard'
import { USE_SAMPLE_CONTENT } from '@/sample'
import { SAMPLE_HOME } from '@/sample/home'
import { SAMPLE_MEMORIES } from '@/sample/memories'
import { useCalendarStore } from '@/state/calendarStore'
import { calendarService } from '@/services/calendar'
import { useStoryStore } from '@/state/storyStore'
import { daysUntilNextOccurrence } from '@/utils/daysUntil'
import { formatCalendarDateLong } from '@/utils/dateUtils'

/** A `Date` as the `YYYY-MM-DD` that `formatDate` understands. */
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * The occasion behind a "Coming up" row.
 *
 * NO FIGMA FRAME. The dashboard drew these rows as flat text, so tapping one did
 * nothing; this gives each of them somewhere to go. Deliberately generic — it
 * resolves ANY key date, not just a birthday, so every row on the dashboard is
 * a door rather than only the one that prompted it.
 *
 * The two actions are the ones the birthday spotlight already draws, so the
 * screen introduces no vocabulary the design has not used.
 */
export function OccasionScreen() {
  const { theme } = useUnistyles()
  const router = useRouter()
  const back = useBackTo('/(app)/home')
  const { key } = useLocalSearchParams<{ key: string }>()
  const keyDates = useStoryStore((state) => state.keyDates)
  const calendarEvent = useCalendarStore((state) => state.events.find((event) => event.id === key))
  const removeCalendarEvent = useCalendarStore((state) => state.remove)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  const storyRow = findComingUp(keyDates, decodeURIComponent(key ?? ''))
  const eventDays = daysUntilNextOccurrence(calendarEvent?.date)
  const row = calendarEvent && eventDays !== null
    ? { key: calendarEvent.id, label: calendarEvent.title, days: eventDays }
    : storyRow

  const addMemory = useCallback(() => router.push('/(app)/memories/new'), [router])
  const calendar = useCallback(() => router.push('/(app)/calendar'), [router])
  const edit = useCallback(() => {
    if (!calendarEvent) return
    router.push(`/(app)/calendar-events/${calendarEvent.id}/edit`)
  }, [calendarEvent, router])
  const remove = useCallback(async () => {
    if (!calendarEvent) return
    const result = await calendarService.remove({ id: calendarEvent.id })
    setConfirmingDelete(false)
    if (!result.ok) {
      setDeleteError(true)
      return
    }
    removeCalendarEvent(calendarEvent.id)
    router.replace('/(app)/calendar')
  }, [calendarEvent, removeCalendarEvent, router])
  const openMemory = useCallback((id: string) => router.push(`/(app)/memories/${id}`), [router])

  if (!row) {
    return (
      <AppScreenLayout activeTab="home" onBack={back}>
        <Text variant="body" tone="body">
          {COPY.missing}
        </Text>
        <Button label={COPY.back} onPress={back} variant="outline" />
      </AppScreenLayout>
    )
  }

  const birthday = isBirthday(row)
  const when = calendarEvent
    ? formatCalendarDateLong(calendarEvent.date)
    : formatCalendarDateLong(iso(dateInDays(row.days)))

  // Only a birthday gets the spotlight photo and the past-birthdays rail; a
  // first-date anniversary borrowing a birthday portrait would be nonsense.
  const photoUri = birthday && storyRow?.sample && USE_SAMPLE_CONTENT
    ? SAMPLE_HOME.spotlight.photoUri
    : undefined
  const past =
    birthday && storyRow?.sample && USE_SAMPLE_CONTENT
      ? SAMPLE_MEMORIES.filter((m) => m.tags.includes('Birthdays'))
      : []

  return (
    <AppScreenLayout activeTab="home" onBack={back}>
      <View style={styles.head}>
        <Text variant="caption" tone="brand">
          {COPY.eyebrow}
        </Text>
        <View style={styles.chip}>
          <Text variant="caption" tone="brand">
            {COPY.countdown(row.days).toUpperCase()}
          </Text>
        </View>

        <Text variant="display" tone="heading">
          {row.label}
        </Text>

        {when ? (
          <Text variant="body" tone="body">
            {COPY.onDate(when)}
          </Text>
        ) : null}
      </View>

      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          // Plain style object — Unistyles styles do not reach expo-image.
          style={{
            width: '100%',
            height: 220,
            borderRadius: theme.radii.field,
            backgroundColor: theme.colors.surface.field,
          }}
          contentFit="cover"
          transition={200}
          testID="occasion-photo"
        />
      ) : (
        <View style={styles.occasionHero} testID="occasion-illustration">
          <View style={styles.occasionIcon}>
            <Feather
              name={birthday ? 'gift' : 'calendar'}
              size={34}
              color={theme.colors.brand.primary}
            />
          </View>
          <Text variant="labelStrong" tone="heading" align="center">
            {COPY.countdown(row.days)}
          </Text>
        </View>
      )}

      {calendarEvent?.location || calendarEvent?.notes ? (
        <View style={styles.section}>
          <Text variant="labelStrong" tone="heading">
            {COPY.detailsLabel}
          </Text>
          <View style={styles.detailCard}>
            {calendarEvent.location ? (
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={16} color={theme.colors.brand.primary} />
                <Text variant="footnote" tone="body">{calendarEvent.location}</Text>
              </View>
            ) : null}
            {calendarEvent.notes ? (
              <Text variant="footnote" tone="body">{calendarEvent.notes}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        {birthday ? (
          <>
            <Button label={COPY.planSurprise} onPress={addMemory} />
            <Button label={COPY.createCard} onPress={addMemory} variant="outline" />
          </>
        ) : (
          <Button label={COPY.addMemory} onPress={addMemory} variant="soft" />
        )}
        {calendarEvent ? (
          <>
            <Button label={COPY.edit} onPress={edit} variant="outline" />
            <Button label={COPY.delete} onPress={() => setConfirmingDelete(true)} variant="link" />
          </>
        ) : null}
      </View>

      {deleteError ? (
        <Text variant="footnote" tone="error" accessibilityRole="alert">
          {COPY.deleteError}
        </Text>
      ) : null}

      {birthday ? (
        <View style={styles.section}>
          <Text variant="labelStrong" tone="heading">
            {COPY.pastLabel}
          </Text>

          {past.length === 0 ? (
            <Text variant="footnote" tone="body">
              {COPY.pastEmpty}
            </Text>
          ) : (
            past.map((memory) =>
              memory.photoUri ? (
                <PhotoMemoryCard key={memory.id} memory={memory} onPress={openMemory} />
              ) : (
                <MemoryCard key={memory.id} memory={memory} onPress={openMemory} />
              ),
            )
          )}
        </View>
      ) : null}

      <Button label={COPY.calendar} onPress={calendar} variant="link" />

      <ConfirmDialog
        visible={confirmingDelete}
        title={COPY.deleteConfirm.title}
        body={COPY.deleteConfirm.body}
        confirmLabel={COPY.deleteConfirm.confirm}
        cancelLabel={COPY.deleteConfirm.cancel}
        onConfirm={remove}
        onCancel={() => setConfirmingDelete(false)}
        destructive
      />
    </AppScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  head: {
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.field,
  },
  actions: {
    gap: theme.spacing.md,
  },
  section: {
    gap: theme.spacing.md,
  },
  occasionHero: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.radii.field,
    backgroundColor: theme.colors.surface.card,
    boxShadow: theme.elevation.card,
  },
  occasionIcon: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.soft,
  },
  detailCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.radii.field,
    backgroundColor: theme.colors.surface.card,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
}))
