import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { SETTINGS_NOTIFICATIONS_COPY as COPY } from '@/copy/settingsNotifications'
import { NotificationsScreen } from '@/modules/module-05-profile/screens/NotificationsScreen'
import { notificationService } from '@/services/notifications'
import { useNotificationStore } from '@/state/notificationStore'
import { usePreferencesStore } from '@/state/preferencesStore'
import { renderScreen } from '@/test/renderScreen'

jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}))

jest.mock('@/services/notifications', () => ({
  notificationService: {
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
  },
}))

const service = jest.mocked(notificationService)
const SERVER_DEFAULTS = {
  enabled: true,
  messages: true,
  occasions: true,
  memories: true,
  quietStart: null,
  quietEnd: null,
  timezone: 'UTC',
}

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usePreferencesStore.getState().reset()
    useNotificationStore.getState().reset()
    service.getPreferences.mockResolvedValue({ ok: true, value: SERVER_DEFAULTS })
    service.updatePreferences.mockImplementation(async (input) => ({ ok: true, value: input }))
  })

  it('shows its title', async () => {
    await renderScreen(<NotificationsScreen />)

    expect(screen.getByText(COPY.title)).toBeTruthy()
  })

  it('turns a single category off', async () => {
    await renderScreen(<NotificationsScreen />)
    await fireEvent(screen.getByRole('switch', { name: COPY.messages }), 'valueChange', false)

    expect(usePreferencesStore.getState().notifyMessages).toBe(false)
    await waitFor(() => expect(service.updatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ messages: false }),
    ))
  })

  it('disables the categories when the master is off, rather than hiding them', async () => {
    await renderScreen(<NotificationsScreen />)
    await fireEvent(screen.getByRole('switch', { name: COPY.masterLabel }), 'valueChange', false)

    const messages = screen.getByRole('switch', { name: COPY.messages })
    expect(messages).toBeTruthy()
    expect(messages.props.accessibilityState).toMatchObject({ disabled: true })
  })

  it('keeps the category choices while the master is off', async () => {
    await renderScreen(<NotificationsScreen />)
    await fireEvent(screen.getByRole('switch', { name: COPY.masterLabel }), 'valueChange', false)

    expect(usePreferencesStore.getState().notifyMessages).toBe(true)
  })

  it('shows quiet hours times only once quiet hours are on', async () => {
    await renderScreen(<NotificationsScreen />)
    expect(screen.queryByText(COPY.quietFrom)).toBeNull()

    await fireEvent(screen.getByRole('switch', { name: COPY.quietLabel }), 'valueChange', true)

    expect(screen.getByText(COPY.quietFrom)).toBeTruthy()
  })

  it('is honest that the two times cannot be changed yet', async () => {
    await renderScreen(<NotificationsScreen />)
    await fireEvent(screen.getByRole('switch', { name: COPY.quietLabel }), 'valueChange', true)

    expect(screen.getByText(COPY.quietTimesFixed)).toBeTruthy()
  })

  it('starts with partner activity off', async () => {
    await renderScreen(<NotificationsScreen />)

    expect(
      screen.getByRole('switch', { name: COPY.partnerActivity }).props.accessibilityState,
    ).toMatchObject({ checked: false })
  })

  it('hydrates backend-supported choices without overwriting local-only choices', async () => {
    usePreferencesStore.getState().setPreference('notifyVoiceNotes', false)
    service.getPreferences.mockResolvedValue({
      ok: true,
      value: {
        ...SERVER_DEFAULTS,
        messages: false,
        occasions: false,
        quietStart: '21:00',
        quietEnd: '06:00',
      },
    })

    await renderScreen(<NotificationsScreen />)

    await waitFor(() => expect(usePreferencesStore.getState().notifyMessages).toBe(false))
    expect(usePreferencesStore.getState().notifyOccasions).toBe(false)
    expect(usePreferencesStore.getState().quietHoursEnabled).toBe(true)
    expect(usePreferencesStore.getState().quietHoursFrom).toBe('21:00')
    expect(usePreferencesStore.getState().notifyVoiceNotes).toBe(false)
  })

  it('keeps unsupported device presentation controls local', async () => {
    await renderScreen(<NotificationsScreen />)

    await fireEvent(screen.getByRole('switch', { name: COPY.sound }), 'valueChange', false)

    expect(usePreferencesStore.getState().notificationSound).toBe(false)
    expect(service.updatePreferences).not.toHaveBeenCalled()
  })

  it('rolls back a failed server-backed choice and reports the failure', async () => {
    service.updatePreferences.mockResolvedValueOnce({
      ok: false,
      error: { code: 'NETWORK' },
    })
    await renderScreen(<NotificationsScreen />)

    await fireEvent(screen.getByRole('switch', { name: COPY.messages }), 'valueChange', false)

    await waitFor(() => expect(screen.getByText(COPY.saveError)).toBeTruthy())
    expect(usePreferencesStore.getState().notifyMessages).toBe(true)
  })
})
