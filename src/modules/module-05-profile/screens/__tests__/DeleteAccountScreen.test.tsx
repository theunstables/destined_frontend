import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { SETTINGS_DELETE_COPY as COPY } from '@/copy/settingsDeleteAccount'
import { DeleteAccountScreen } from '@/modules/module-05-profile/screens/DeleteAccountScreen'
import { accountService } from '@/services/account'
import { useAccountStore } from '@/state/accountStore'
import { renderScreen } from '@/test/renderScreen'

jest.mock('@/services/account', () => ({
  accountService: {
    getDeletionStatus: jest.fn(),
    requestDeletion: jest.fn(),
    cancelDeletion: jest.fn(),
  },
}))

const service = jest.mocked(accountService)

jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}))

const CLEAR = { pending: false }
const PENDING = {
  pending: true,
  requestedAt: '2026-10-12T00:00:00Z',
  executeAfter: '2026-11-11T00:00:00Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  useAccountStore.getState().reset()
  service.getDeletionStatus.mockResolvedValue({ ok: true, value: CLEAR })
  service.requestDeletion.mockResolvedValue({ ok: true, value: PENDING })
  service.cancelDeletion.mockResolvedValue({ ok: true, value: CLEAR })
})

describe('DeleteAccountScreen', () => {
  it('schedules deletion through the real grace-period provider', async () => {
    const user = userEvent.setup()
    await renderScreen(<DeleteAccountScreen />)

    await screen.findByText(COPY.warningHeading)
    await user.press(screen.getByRole('button', { name: COPY.continue }))
    await user.press(screen.getByRole('button', { name: COPY.reasonSkip }))

    expect(screen.getByText(COPY.finalBody)).toBeTruthy()
    await user.press(screen.getByRole('button', { name: COPY.finalConfirm }))

    await waitFor(() => expect(service.requestDeletion).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(COPY.doneHeading)).toBeTruthy()
    expect(screen.getByText(/November 11, 2026/)).toBeTruthy()
  })

  it('shows an existing pending request immediately and can cancel it', async () => {
    useAccountStore.getState().setDeletion(PENDING)
    const user = userEvent.setup()
    await renderScreen(<DeleteAccountScreen />)

    expect(screen.getByText(COPY.doneHeading)).toBeTruthy()
    await user.press(screen.getByRole('button', { name: COPY.cancelDeletion }))

    await waitFor(() => expect(service.cancelDeletion).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(COPY.cancellationComplete)).toBeTruthy()
    expect(screen.getByText(COPY.warningHeading)).toBeTruthy()
  })

  it('does not claim deletion was scheduled when the provider fails', async () => {
    service.requestDeletion.mockResolvedValueOnce({ ok: false, error: { code: 'NETWORK' } })
    const user = userEvent.setup()
    await renderScreen(<DeleteAccountScreen />)

    await screen.findByText(COPY.warningHeading)
    await user.press(screen.getByRole('button', { name: COPY.continue }))
    await user.press(screen.getByRole('button', { name: COPY.reasonSkip }))
    await user.press(screen.getByRole('button', { name: COPY.finalConfirm }))

    expect(await screen.findByText(COPY.requestError)).toBeTruthy()
    expect(screen.queryByText(COPY.doneHeading)).toBeNull()
  })
})