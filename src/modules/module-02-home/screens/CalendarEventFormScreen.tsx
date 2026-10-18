import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { CALENDAR_COPY as COPY } from '@/copy/calendar'
import { AppScreenLayout } from '@/design-system/patterns/AppScreenLayout'
import { SettingsToggleRow } from '@/design-system/patterns/SettingsToggleRow'
import { Button } from '@/design-system/primitives/Button'
import { DateField } from '@/design-system/primitives/DateField'
import { Input } from '@/design-system/primitives/Input'
import { Text } from '@/design-system/primitives/Text'
import { useBackTo } from '@/hooks/useBackTo'
import { calendarService } from '@/services/calendar'
import { useCalendarStore } from '@/state/calendarStore'
import { parseCalendarDate } from '@/utils/dateUtils'

type Props = { mode: 'create' | 'edit' }

/** Shared create/edit surface for durable calendar events. */
export function CalendarEventFormScreen({ mode }: Props) {
  const router = useRouter()
  const back = useBackTo('/(app)/calendar')
  const { id } = useLocalSearchParams<{ id?: string }>()
  const existing = useCalendarStore((state) => state.events.find((event) => event.id === id))
  const events = useCalendarStore((state) => state.events)
  const hydrate = useCalendarStore((state) => state.hydrate)
  const [title, setTitle] = useState(existing?.title ?? '')
  const [date, setDate] = useState(existing?.date ?? '')
  const [location, setLocation] = useState(existing?.location ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [repeatsAnnually, setRepeatsAnnually] = useState(existing?.repeatsAnnually ?? false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = useCallback(async () => {
    const cleanTitle = title.trim()
    const validDate = parseCalendarDate(date)
    if (!cleanTitle) setTitleError(COPY.form.titleRequired)
    if (!validDate) setDateError(COPY.form.dateRequired)
    if (!cleanTitle || !validDate) return

    setSaving(true)
    setFormError(null)
    const input = {
      title: cleanTitle,
      date,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      kind: existing?.kind ?? ('custom' as const),
      repeatsAnnually,
      startsAt: existing?.startsAt,
      endsAt: existing?.endsAt,
      reminderMinutesBefore: existing?.reminderMinutesBefore,
    }
    const result = mode === 'edit' && existing
      ? await calendarService.update({ id: existing.id, changes: input })
      : await calendarService.create(input)

    if (!result.ok) {
      setSaving(false)
      setFormError(COPY.form.saveError)
      return
    }

    const nextEvents = mode === 'edit'
      ? events.map((event) => event.id === result.value.id ? result.value : event)
      : [...events, result.value]
    const upcoming = await calendarService.upcoming()
    hydrate(nextEvents, upcoming.ok ? upcoming.value : [])
    setSaving(false)
    router.replace({ pathname: '/(app)/occasions/[key]', params: { key: result.value.id } })
  }, [date, events, existing, hydrate, location, mode, notes, repeatsAnnually, router, title])

  if (mode === 'edit' && !existing) {
    return (
      <AppScreenLayout activeTab="home" onBack={back}>
        <Text variant="body" tone="body">{COPY.form.missing}</Text>
        <Button label={COPY.back} onPress={back} variant="outline" />
      </AppScreenLayout>
    )
  }

  return (
    <AppScreenLayout activeTab="home" onBack={back}>
      <Text variant="display" tone="heading">
        {mode === 'edit' ? COPY.form.editHeading : COPY.form.newHeading}
      </Text>
      <View style={styles.form}>
        <Input
          label={COPY.form.titleLabel}
          value={title}
          onChangeText={(next) => { setTitle(next); setTitleError(null) }}
          placeholder={COPY.form.titlePlaceholder}
          autoCapitalize="sentences"
          error={titleError ?? undefined}
        />
        <View>
          <DateField
            label={COPY.form.dateLabel}
            value={date}
            onChangeText={(next) => { setDate(next); setDateError(null) }}
          />
          {dateError ? <Text variant="footnote" tone="error">{dateError}</Text> : null}
        </View>
        <Input
          label={COPY.form.locationLabel}
          value={location}
          onChangeText={setLocation}
          placeholder={COPY.form.locationPlaceholder}
          autoCapitalize="words"
        />
        <Input
          label={COPY.form.notesLabel}
          value={notes}
          onChangeText={setNotes}
          placeholder={COPY.form.notesPlaceholder}
          autoCapitalize="sentences"
          multiline
        />
        <SettingsToggleRow
          icon="repeat"
          label={COPY.form.repeats}
          value={repeatsAnnually}
          onValueChange={setRepeatsAnnually}
        />
        {formError ? <Text variant="footnote" tone="error" accessibilityRole="alert">{formError}</Text> : null}
        <Button
          label={mode === 'edit' ? COPY.form.update : COPY.form.create}
          onPress={submit}
          loading={saving}
          disabled={saving}
        />
        <Button label={COPY.form.cancel} onPress={back} variant="link" />
      </View>
    </AppScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  form: { gap: theme.spacing.md },
}))