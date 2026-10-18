import { screen, userEvent } from '@testing-library/react-native'

import { CALENDAR_COPY as COPY } from '@/copy/calendar'
import { CalendarEventFormScreen } from '@/modules/module-02-home/screens/CalendarEventFormScreen'
import { calendarService } from '@/services/calendar'
import { useCalendarStore } from '@/state/calendarStore'
import { renderScreen } from '@/test/renderScreen'

jest.mock('@/services/calendar', () => ({
  calendarService: {
    create: jest.fn(),
    update: jest.fn(),
    upcoming: jest.fn(),
  },
}))

const service = jest.mocked(calendarService)
const mockReplace = jest.fn()
let mockId: string | undefined

jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, push: jest.fn(), replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({ id: mockId }),
}))

const EVENT = {
  id: 'event-1',
  title: 'Dinner reservation',
  date: '2026-11-11',
  location: 'Our favorite place',
  kind: 'dateNight' as const,
  repeatsAnnually: false,
  createdAt: '2026-10-12T00:00:00Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockId = undefined
  useCalendarStore.getState().reset()
  useCalendarStore.getState().hydrate([])
  service.create.mockResolvedValue({ ok: true, value: EVENT })
  service.update.mockResolvedValue({ ok: true, value: EVENT })
  service.upcoming.mockResolvedValue({ ok: true, value: [] })
})

describe('CalendarEventFormScreen', () => {
  it('requires a name and valid date before creating', async () => {
    const user = userEvent.setup()
    await renderScreen(<CalendarEventFormScreen mode="create" />)

    await user.press(screen.getByRole('button', { name: COPY.form.create }))

    expect(screen.getByText(COPY.form.titleRequired)).toBeTruthy()
    expect(screen.getByText(COPY.form.dateRequired)).toBeTruthy()
    expect(service.create).not.toHaveBeenCalled()
  })

  it('creates a durable event and refreshes the upcoming projection', async () => {
    const user = userEvent.setup()
    await renderScreen(<CalendarEventFormScreen mode="create" />)

    await user.type(screen.getByLabelText(COPY.form.titleLabel), 'Dinner reservation')
    await user.type(screen.getByLabelText(COPY.form.dateLabel), '2026-11-11')
    await user.press(screen.getByRole('button', { name: COPY.form.create }))

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Dinner reservation',
      date: '2026-11-11',
      kind: 'custom',
    }))
    expect(service.upcoming).toHaveBeenCalled()
    expect(useCalendarStore.getState().events).toContainEqual(EVENT)
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/(app)/occasions/[key]',
      params: { key: EVENT.id },
    })
  })

  it('updates the event identified by the route', async () => {
    mockId = EVENT.id
    useCalendarStore.getState().hydrate([EVENT])
    const user = userEvent.setup()
    await renderScreen(<CalendarEventFormScreen mode="edit" />)

    await user.clear(screen.getByLabelText(COPY.form.titleLabel))
    await user.type(screen.getByLabelText(COPY.form.titleLabel), 'Anniversary dinner')
    service.update.mockResolvedValue({ ok: true, value: { ...EVENT, title: 'Anniversary dinner' } })
    await user.press(screen.getByRole('button', { name: COPY.form.update }))

    expect(service.update).toHaveBeenCalledWith(expect.objectContaining({
      id: EVENT.id,
      changes: expect.objectContaining({ title: 'Anniversary dinner' }),
    }))
    expect(useCalendarStore.getState().events[0].title).toBe('Anniversary dinner')
  })
})