import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { SETTINGS_NOTIFICATIONS_COPY as COPY } from '@/copy/settingsNotifications'
import { SectionPanel } from '@/design-system/patterns/SectionPanel'
import { SettingsRow } from '@/design-system/patterns/SettingsRow'
import { SettingsScreenLayout } from '@/design-system/patterns/SettingsScreenLayout'
import { SettingsToggleRow } from '@/design-system/patterns/SettingsToggleRow'
import { Text } from '@/design-system/primitives/Text'
import { notificationService, type NotificationPreferences } from '@/services/notifications'
import { useNotificationStore } from '@/state/notificationStore'
import {
  usePreferencesStore,
  type BooleanPreferenceKey,
  type Preferences,
} from '@/state/preferencesStore'

type ServerPreferenceKey =
  | 'notificationsEnabled'
  | 'notifyMessages'
  | 'notifyNewMemories'
  | 'notifyOccasions'
  | 'quietHoursEnabled'

const SERVER_KEYS = new Set<BooleanPreferenceKey>([
  'notificationsEnabled',
  'notifyMessages',
  'notifyNewMemories',
  'notifyOccasions',
  'quietHoursEnabled',
])

function timezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function toServerPreferences(
  preferences: Preferences,
  override?: { key: ServerPreferenceKey; value: boolean },
): NotificationPreferences {
  const value = <K extends ServerPreferenceKey>(key: K) =>
    override?.key === key ? override.value : preferences[key]
  const quiet = value('quietHoursEnabled')

  return {
    enabled: value('notificationsEnabled'),
    messages: value('notifyMessages'),
    memories: value('notifyNewMemories'),
    occasions: value('notifyOccasions'),
    quietStart: quiet ? preferences.quietHoursFrom : null,
    quietEnd: quiet ? preferences.quietHoursTo : null,
    timezone: timezone(),
  }
}

/**
 * M05-S10 — Settings → Notifications.
 *
 * The master switch DISABLES the categories, it does not hide them. A list
 * that changes length under the finger moves the next row into the place the
 * thumb is already travelling to, and the categories are also the answer to
 * "what would I get if I turned this back on" — which is worth being able to
 * read while it is off.
 */
export function NotificationsScreen() {
  const router = useRouter()
  const state = usePreferencesStore()
  const toggle = usePreferencesStore((s) => s.toggle)
  const setPreference = usePreferencesStore((s) => s.setPreference)
  const notificationPreferences = useNotificationStore((s) => s.preferences)
  const notificationsHydrated = useNotificationStore((s) => s.hydrated)
  const hydrateNotifications = useNotificationStore((s) => s.hydrate)
  const [saveError, setSaveError] = useState(false)
  const [saving, setSaving] = useState(false)
  const mounted = useRef(true)
  const hasInteracted = useRef(false)
  const serverWriteInFlight = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const apply = (preferences: NotificationPreferences) => {
      setPreference('notificationsEnabled', preferences.enabled)
      setPreference('notifyMessages', preferences.messages)
      setPreference('notifyNewMemories', preferences.memories)
      setPreference('notifyOccasions', preferences.occasions)
      setPreference('quietHoursEnabled', Boolean(preferences.quietStart && preferences.quietEnd))
      if (preferences.quietStart) setPreference('quietHoursFrom', preferences.quietStart)
      if (preferences.quietEnd) setPreference('quietHoursTo', preferences.quietEnd)
    }

    if (notificationsHydrated && notificationPreferences) {
      apply(notificationPreferences)
      return () => { active = false }
    }

    void notificationService.getPreferences().then((result) => {
      if (!active || !result.ok) return
      hydrateNotifications(result.value)
      if (!hasInteracted.current) apply(result.value)
    })

    return () => { active = false }
  }, [hydrateNotifications, notificationPreferences, notificationsHydrated, setPreference])

  const goBack = useCallback(() => router.back(), [router])
  const off = !state.notificationsEnabled

  const change = useCallback((key: BooleanPreferenceKey) => {
    const serverBacked = SERVER_KEYS.has(key)
    if (serverBacked && serverWriteInFlight.current) return

    hasInteracted.current = true
    const previous = usePreferencesStore.getState()[key]
    const next = !previous
    toggle(key)
    setSaveError(false)

    // Voice notes, On This Day, partner activity, sound and vibration remain
    // device presentation choices because the backend contract has no fields
    // for them. Do not collapse distinct controls into unrelated API flags.
    if (!serverBacked) return

    serverWriteInFlight.current = true
    setSaving(true)

    const input = toServerPreferences(usePreferencesStore.getState(), {
      key: key as ServerPreferenceKey,
      value: next,
    })

    void notificationService.updatePreferences(input).then((result) => {
      serverWriteInFlight.current = false
      if (!mounted.current) return
      setSaving(false)

      if (result.ok) {
        hydrateNotifications(result.value)
        return
      }

      setPreference(key, previous)
      setSaveError(true)
    })
  }, [hydrateNotifications, setPreference, toggle])

  return (
    <SettingsScreenLayout title={COPY.title} lede={COPY.lede} onBack={goBack}>
      <SectionPanel title={COPY.masterGroup}>
        <SettingsToggleRow
          icon="bell"
          label={COPY.masterLabel}
          detail={COPY.masterDetail}
          value={state.notificationsEnabled}
          onValueChange={() => change('notificationsEnabled')}
          disabled={saving}
        />
      </SectionPanel>

      <SectionPanel title={COPY.categoryGroup}>
        <SettingsToggleRow
          icon="message-circle"
          label={COPY.messages}
          detail={COPY.messagesDetail}
          value={state.notifyMessages}
          onValueChange={() => change('notifyMessages')}
          disabled={off || saving}
        />
        <SettingsToggleRow
          icon="mic"
          label={COPY.voiceNotes}
          detail={COPY.voiceNotesDetail}
          value={state.notifyVoiceNotes}
          onValueChange={() => change('notifyVoiceNotes')}
          disabled={off}
        />
        <SettingsToggleRow
          icon="image"
          label={COPY.newMemories}
          detail={COPY.newMemoriesDetail}
          value={state.notifyNewMemories}
          onValueChange={() => change('notifyNewMemories')}
          disabled={off || saving}
        />
        <SettingsToggleRow
          icon="sunrise"
          label={COPY.onThisDay}
          detail={COPY.onThisDayDetail}
          value={state.notifyOnThisDay}
          onValueChange={() => change('notifyOnThisDay')}
          disabled={off}
        />
        <SettingsToggleRow
          icon="calendar"
          label={COPY.occasions}
          detail={COPY.occasionsDetail}
          value={state.notifyOccasions}
          onValueChange={() => change('notifyOccasions')}
          disabled={off || saving}
        />
        <SettingsToggleRow
          icon="activity"
          label={COPY.partnerActivity}
          detail={COPY.partnerActivityDetail}
          value={state.notifyPartnerActivity}
          onValueChange={() => change('notifyPartnerActivity')}
          disabled={off}
        />
      </SectionPanel>

      <SectionPanel title={COPY.quietGroup}>
        <SettingsToggleRow
          icon="moon"
          label={COPY.quietLabel}
          detail={COPY.quietDetail}
          value={state.quietHoursEnabled}
          onValueChange={() => change('quietHoursEnabled')}
          disabled={off || saving}
        />

        {/*
          The two times appear only when quiet hours are on. This is the one
          place in the cluster where a row is hidden rather than disabled, and
          the reason is the opposite of the master switch above: "from 22:00
          until 07:00" is meaningless while the feature is off, where "Messages,
          on" still tells you something.
        */}
        {state.quietHoursEnabled ? (
          <>
            <SettingsRow icon="sunset" label={COPY.quietFrom} value={state.quietHoursFrom} />
            <SettingsRow icon="sunrise" label={COPY.quietTo} value={state.quietHoursTo} />

            {/*
              Neither row is pressable, and a row with no chevron is this app's
              way of saying "nothing happens here" — but "nothing happens here"
              is not the same as "you cannot change this at all", and only the
              second one is true. So it is written down.
            */}
            <Text variant="footnote" tone="body">
              {COPY.quietTimesFixed}
            </Text>
          </>
        ) : null}
      </SectionPanel>

      <SectionPanel title={COPY.soundGroup}>
        <SettingsToggleRow
          icon="volume-2"
          label={COPY.sound}
          value={state.notificationSound}
          onValueChange={() => change('notificationSound')}
          disabled={off}
        />
        <SettingsToggleRow
          icon="smartphone"
          label={COPY.vibration}
          value={state.notificationVibration}
          onValueChange={() => change('notificationVibration')}
          disabled={off}
        />
      </SectionPanel>

      {saveError ? (
        <Text variant="footnote" tone="error" accessibilityRole="alert">
          {COPY.saveError}
        </Text>
      ) : null}
    </SettingsScreenLayout>
  )
}
