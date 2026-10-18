import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { REPAIR_SIGNAL_COPY as COPY } from '@/copy/repairSignal'
import { RepairSignalCard } from '@/modules/module-02-home/components/RepairSignalCard'
import { useRepairSignalStore } from '@/state/repairSignalStore'
import { renderScreen } from '@/test/renderScreen'

const OPEN_SIGNAL = {
  id: 'signal-1',
  status: 'open' as const,
  sentByMe: true,
  mutual: false,
  createdAt: '2026-10-12T10:00:00Z',
  expiresAt: '2026-10-13T10:00:00Z',
}

describe('RepairSignalCard', () => {
  beforeEach(() => {
    useRepairSignalStore.getState().reset()
  })

  it('offers a consent-forward invitation when no signal is open', async () => {
    useRepairSignalStore.getState().hydrate(null)
    await renderScreen(<RepairSignalCard />)

    expect(screen.getByText(COPY.idleHeading)).toBeTruthy()
    expect(screen.getByText(COPY.idleBody)).toBeTruthy()
    expect(screen.getByRole('button', { name: COPY.send })).toBeTruthy()
  })

  it('confirms before cancelling an open signal', async () => {
    useRepairSignalStore.getState().hydrate(OPEN_SIGNAL)
    await renderScreen(<RepairSignalCard />)

    await userEvent.press(screen.getByRole('button', { name: COPY.cancel }))

    expect(screen.getByRole('alert')).toHaveTextContent(COPY.confirmTitle)
    expect(screen.getByRole('button', { name: COPY.keep })).toBeTruthy()
    expect(screen.getByRole('button', { name: COPY.confirmCancel })).toBeTruthy()
  })

  it('shows a mutual state without another demand', async () => {
    useRepairSignalStore.getState().hydrate({
      ...OPEN_SIGNAL,
      status: 'mutual',
      mutual: true,
      sentByMe: false,
    })
    await renderScreen(<RepairSignalCard />)

    expect(screen.getByText(COPY.mutualHeading)).toBeTruthy()
    expect(screen.getByText(COPY.mutualBody)).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('button')).toBeNull())
  })

  it('announces provider failures without hiding the available action', async () => {
    useRepairSignalStore.setState({
      signal: null,
      hydrated: true,
      loading: false,
      error: 'NETWORK',
    })
    await renderScreen(<RepairSignalCard />)

    expect(screen.getByRole('alert')).toHaveTextContent(COPY.errors.NETWORK)
    expect(screen.getByRole('button', { name: COPY.send })).toBeTruthy()
  })

  it('marks the send action busy while the store is loading', async () => {
    useRepairSignalStore.setState({ signal: null, hydrated: true, loading: true })
    await renderScreen(<RepairSignalCard />)

    expect(screen.getByRole('button', { name: COPY.send })).toHaveAccessibilityState({
      busy: true,
      disabled: true,
    })
  })

  it('does not send twice while the first action is unresolved', async () => {
    let resolveSend: (() => void) | undefined
    const send = jest.fn(() => new Promise<void>((resolve) => { resolveSend = resolve }))
    useRepairSignalStore.setState({ signal: null, hydrated: true, send })
    const user = userEvent.setup()
    await renderScreen(<RepairSignalCard />)

    const button = screen.getByRole('button', { name: COPY.send })
    await user.press(button)
    await user.press(button)

    expect(send).toHaveBeenCalledTimes(1)
    resolveSend?.()
  })
})