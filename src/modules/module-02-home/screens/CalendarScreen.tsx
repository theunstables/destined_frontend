import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { useBackTo } from '@/hooks/useBackTo'
import { CALENDAR_COPY as COPY } from '@/copy/calendar'
import { AppScreenLayout } from '@/design-system/patterns/AppScreenLayout'
import { Button } from '@/design-system/primitives/Button'
import { Card } from '@/design-system/primitives/Card'
import { Text } from '@/design-system/primitives/Text'
import { buildComingUp, dateInDays } from '@/modules/module-02-home/comingUp'
import { USE_SAMPLE_CONTENT } from '@/sample'
import { SAMPLE_HOME } from '@/sample/home'
import { calendarService } from '@/services/calendar'
import type { CalendarEvent } from '@/services/calendar/types'
import { useCalendarStore } from '@/state/calendarStore'
import { useStoryStore } from '@/state/storyStore'
import { parseCalendarDate } from '@/utils/dateUtils'

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/**
 * Builds the day cells for one month: leading blanks so the 1st lands on its
 * real weekday, then the days.
 *
 * Exported because the arithmetic — leap years, month lengths, the blank
 * offset — is the only thing here worth testing without a renderer.
 */
export function monthGrid(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay()
  const dayCount = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstWeekday).fill(null)

  for (let day = 1; day <= dayCount; day += 1) cells.push(day)

  return cells
}

function eventDayInMonth(event: CalendarEvent, year: number, month: number): number | null {
  const date = parseCalendarDate(event.date)
  if (!date || date.month !== month + 1) return null
  if (!event.repeatsAnnually && date.year !== year) return null
  return date.day
}

/**
 * The couple's calendar.
 *
 * NO FIGMA FRAME. The note pinned beside the dashboard in the Figma file lists
 * "Calendar", "Notes" and "Any other events they wish to pin" as home-screen
 * features; this screen is that note, built from the app's own components.
 *
 * Events are placed by their countdown rather than by a stored calendar date —
 * `Coming up` knows how many days away each date is, and the sample rows have no
 * year of their own. That keeps sample events in view near today instead of
 * stranded in a month nobody scrolls to.
 */
export function CalendarScreen() {
  const { theme } = useUnistyles()
  const router = useRouter()
  const back = useBackTo('/(app)/home')
  const keyDates = useStoryStore((state) => state.keyDates)
  const calendarEvents = useCalendarStore((state) => state.events)
  const hydrated = useCalendarStore((state) => state.hydrated)
  const hydrateCalendar = useCalendarStore((state) => state.hydrate)
  const [loadError, setLoadError] = useState(false)

  const today = new Date()
  const [offset, setOffset] = useState(0)

  const shown = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const year = shown.getFullYear()
  const month = shown.getMonth()

  const loadCalendar = useCallback(async () => {
    setLoadError(false)
    const [eventsResult, upcomingResult] = await Promise.all([
      calendarService.list(),
      calendarService.upcoming(),
    ])

    if (!eventsResult.ok) {
      setLoadError(true)
      return
    }

    hydrateCalendar(eventsResult.value, upcomingResult.ok ? upcomingResult.value : [])
  }, [hydrateCalendar])

  useEffect(() => {
    if (!hydrated) void loadCalendar()
  }, [hydrated, loadCalendar])

  const storyRows = buildComingUp(keyDates)
  const rows = calendarEvents.length > 0
    ? storyRows.filter((row) => !row.sample)
    : storyRows

  const events = rows.map((row) => ({ ...row, on: dateInDays(row.days, today) }))
  const storyInMonth = events.filter((e) => e.on.getFullYear() === year && e.on.getMonth() === month)
  const providerInMonth = calendarEvents
    .map((event) => ({ event, day: eventDayInMonth(event, year, month) }))
    .filter((row): row is { event: CalendarEvent; day: number } => row.day !== null)
  const markedDays = new Set([
    ...storyInMonth.map((e) => e.on.getDate()),
    ...providerInMonth.map((e) => e.day),
  ])

  const reminders = USE_SAMPLE_CONTENT ? SAMPLE_HOME.littleThings : []

  const addDate = useCallback(() => router.push('/(app)/calendar-events/new'), [router])
  const addMemory = useCallback(() => router.push('/(app)/memories/new'), [router])
  const openOccasion = useCallback(
    // Object form: expo-router types the dynamic segment as a param here and
    // handles the encoding, which a template string does not.
    (key: string) => router.push({ pathname: '/(app)/occasions/[key]', params: { key } }),
    [router],
  )

  const isThisMonth = offset === 0

  return (
    <AppScreenLayout activeTab="home" onBack={back}>
      <View style={styles.head}>
        <Text variant="caption" tone="brand">
          {COPY.eyebrow}
        </Text>
        <Text variant="display" tone="heading">
          {COPY.title}
        </Text>
        <Text variant="body" tone="body">
          {COPY.lede}
        </Text>
      </View>

      <Card>
        <View style={styles.monthBar}>
          <Text variant="labelStrong" tone="heading">
            {COPY.monthLabel(MONTHS[month], year)}
          </Text>

          <View style={styles.monthNav}>
            <Pressable
              onPress={() => setOffset((o) => o - 1)}
              accessibilityRole="button"
              accessibilityLabel={COPY.prev}
              style={styles.arrow}
            >
              <Feather name="chevron-left" size={18} color={theme.colors.brand.primary} />
            </Pressable>
            <Pressable
              onPress={() => setOffset((o) => o + 1)}
              accessibilityRole="button"
              accessibilityLabel={COPY.next}
              style={styles.arrow}
            >
              <Feather name="chevron-right" size={18} color={theme.colors.brand.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.week}>
          {COPY.weekdays.map((d, i) => (
            <View key={`${d}-${i}`} style={styles.cell}>
              <Text variant="caption" tone="body" align="center">
                {d}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.grid}>
          {monthGrid(year, month).map((day, i) => {
            const isToday = isThisMonth && day === today.getDate()

            return (
              <View key={i} style={styles.cell}>
                {day === null ? null : (
                  <View
                    style={[
                      styles.day,
                      markedDays.has(day) ? styles.dayEvent : null,
                      isToday ? styles.dayToday : null,
                    ]}
                  >
                    <Text
                      variant="footnote"
                      tone={isToday ? 'onPrimary' : 'heading'}
                      align="center"
                    >
                      {day}
                    </Text>
                    {markedDays.has(day) ? (
                      <View
                        style={[styles.dot, isToday ? styles.dotOnToday : null]}
                        testID={`calendar-dot-${day}`}
                      />
                    ) : null}
                  </View>
                )}
              </View>
            )
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendDot} />
          <Text variant="caption" tone="body">
            {COPY.eventLegend}
          </Text>
        </View>
      </Card>

      {loadError ? (
        <Card>
          <View accessibilityRole="alert" style={styles.feedback}>
            <Feather name="wifi-off" size={18} color={theme.colors.feedback.error} />
            <Text variant="footnote" tone="body">
              {COPY.error}
            </Text>
          </View>
          <Button label={COPY.retry} onPress={loadCalendar} variant="soft" />
        </Card>
      ) : !hydrated ? (
        <Text variant="footnote" tone="body">
          {COPY.loading}
        </Text>
      ) : null}

      <View style={styles.section}>
        <Text variant="labelStrong" tone="heading">
          {COPY.agendaLabel}
        </Text>

        {storyInMonth.length === 0 && providerInMonth.length === 0 ? (
          <Card>
            <Text variant="footnote" tone="body">
              {COPY.agendaEmpty}
            </Text>
            <Button label={COPY.addDate} onPress={addDate} variant="soft" />
          </Card>
        ) : (
          [...providerInMonth.map(({ event, day }) => ({
            key: event.id,
            label: event.title,
            day,
            detail: event.location,
          })), ...storyInMonth.map((event) => ({
            key: event.key,
            label: event.label,
            day: event.on.getDate(),
            detail: undefined,
          }))].map((event, i) => {
            // Accents cycle by position, per the palette's own note.
            const accent = theme.colors.accents[i % theme.colors.accents.length]

            return (
              <Pressable
                key={event.key}
                onPress={() => openOccasion(event.key)}
                accessibilityRole="button"
                accessibilityLabel={event.label}
              >
                <Card>
                  <View style={styles.row}>
                    <View style={[styles.tile, { backgroundColor: accent.soft }]}>
                      <Text variant="caption" tone="heading" align="center">
                        {event.day}
                      </Text>
                    </View>

                    <View style={styles.rowText}>
                      <Text variant="labelStrong" tone="heading">
                        {event.label}
                      </Text>
                      <Text variant="caption" tone="body">
                        {event.detail ?? `${MONTHS[month]} ${event.day}`}
                      </Text>
                    </View>

                    <Feather name="chevron-right" size={16} color={accent.ink} />
                  </View>
                </Card>
              </Pressable>
            )
          })
        )}
      </View>

      <View style={styles.section}>
        <Text variant="labelStrong" tone="heading">
          {COPY.remindersLabel}
        </Text>

        {reminders.length === 0 ? (
          <Card>
            <Text variant="footnote" tone="body">
              {COPY.remindersEmpty}
            </Text>
            <Button label={COPY.writeNote} onPress={addMemory} variant="soft" />
          </Card>
        ) : (
          reminders.map((thing) => (
            <Card key={thing.key}>
              <View style={styles.row}>
                <Feather name="bookmark" size={14} color={theme.colors.brand.primary} />
                <View style={styles.rowText}>
                  <Text variant="footnote" tone="body">
                    {thing.text}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </AppScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  head: {
    gap: theme.spacing.xs,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNav: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  arrow: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.radii.field,
    backgroundColor: theme.colors.surface.field,
  },
  week: {
    flexDirection: 'row',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  day: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    backgroundColor: theme.colors.brand.primary,
  },
  dayEvent: {
    backgroundColor: theme.colors.surface.soft,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.brand.primary,
    marginTop: 1,
  },
  dotOnToday: {
    backgroundColor: theme.colors.text.onPrimary,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.accents[0].ink,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  section: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  tile: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
}))
