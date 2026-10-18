import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { TIMELINE_COPY as COPY } from '@/copy/timeline'
import { TimelineScreen } from '@/modules/module-04-timeline/screens/TimelineScreen'
import { timelineService } from '@/services/timeline'
import { useTimelineStore } from '@/state/timelineStore'
import { renderScreen } from '@/test/renderScreen'

jest.mock('@/services/timeline', () => ({
  timelineService: { list: jest.fn() },
}))

const service = jest.mocked(timelineService)
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    canGoBack: () => true,
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
}))

const MEMORY = {
  id: 'memory-1',
  type: 'memory' as const,
  date: '2025-02-14',
  title: 'A rainy-day picnic',
  subtitle: 'The park was ours.',
}

const STORY = {
  id: 'story-met',
  type: 'story' as const,
  date: '2024-06-01',
  title: 'The day we met',
}

beforeEach(() => {
  jest.clearAllMocks()
  useTimelineStore.getState().reset()
  service.list.mockResolvedValue({ ok: true, value: { items: [] } })
})

describe('T01 Timeline', () => {
  it('loads and renders the provider-backed story', async () => {
    service.list.mockResolvedValue({ ok: true, value: { items: [MEMORY, STORY] } })

    await renderScreen(<TimelineScreen />)

    expect(await screen.findByText(MEMORY.title)).toBeTruthy()
    expect(screen.getByText(STORY.title)).toBeTruthy()
    expect(screen.getByText('February 14, 2025')).toBeTruthy()
    expect(service.list).toHaveBeenCalledWith()
  })

  it('opens a memory while leaving non-addressable story milestones still readable', async () => {
    useTimelineStore.getState().hydrate({ items: [MEMORY, STORY] })
    const user = userEvent.setup()

    await renderScreen(<TimelineScreen />)
    await user.press(screen.getByRole('button', { name: /A rainy-day picnic/ }))

    expect(mockPush).toHaveBeenCalledWith('/(app)/memories/memory-1')
    expect(screen.queryByRole('button', { name: /The day we met/ })).toBeNull()
  })

  it('appends an earlier cursor page without replacing visible moments', async () => {
    useTimelineStore.getState().hydrate({ items: [MEMORY], nextCursor: 'older-1' })
    service.list.mockResolvedValue({ ok: true, value: { items: [STORY] } })
    const user = userEvent.setup()

    await renderScreen(<TimelineScreen />)
    await user.press(screen.getByRole('button', { name: COPY.loadMore }))

    expect(service.list).toHaveBeenCalledWith({ cursor: 'older-1' })
    expect(await screen.findByText(STORY.title)).toBeTruthy()
    expect(screen.getByText(MEMORY.title)).toBeTruthy()
  })

  it('offers a real creation path when the timeline is empty', async () => {
    useTimelineStore.getState().hydrate({ items: [] })
    const user = userEvent.setup()

    await renderScreen(<TimelineScreen />)
    expect(screen.getByText(COPY.empty.heading)).toBeTruthy()

    await user.press(screen.getByRole('button', { name: COPY.empty.action }))
    expect(mockPush).toHaveBeenCalledWith('/(app)/memories/new')
  })

  it('recovers from an initial network failure', async () => {
    service.list
      .mockResolvedValueOnce({ ok: false, error: { code: 'NETWORK' } })
      .mockResolvedValueOnce({ ok: true, value: { items: [MEMORY] } })
    const user = userEvent.setup()

    await renderScreen(<TimelineScreen />)
    expect(await screen.findByText(COPY.errors.NETWORK)).toBeTruthy()

    await user.press(screen.getByRole('button', { name: COPY.retry }))

    await waitFor(() => expect(screen.getByText(MEMORY.title)).toBeTruthy())
    expect(service.list).toHaveBeenCalledTimes(2)
  })
})