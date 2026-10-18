import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { SETTINGS_PARTNER_COPY as COPY } from '@/copy/settingsPartner'
import { PartnerScreen } from '@/modules/module-05-profile/screens/PartnerScreen'
import { pairingService } from '@/services/pairing'
import { useAccountStore } from '@/state/accountStore'
import { useRelationshipStore } from '@/state/relationshipStore'
import { renderScreen } from '@/test/renderScreen'

jest.mock('@/services/pairing', () => ({
  pairingService: { requestUnpair: jest.fn(), cancelUnpair: jest.fn() },
}))
jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}))

const service = jest.mocked(pairingService)
const connected = {
  status: 'connected' as const,
  sharedWritesAllowed: true,
  unpairPending: false,
  unpairRequestedByMe: false,
}
const pending = {
  status: 'paused' as const,
  sharedWritesAllowed: false,
  unpairPending: true,
  unpairRequestedByMe: true,
  unpairRequestedAt: '2026-10-12T00:00:00Z',
  unpairExpiresAt: '2026-10-19T00:00:00Z',
}

describe('PartnerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useRelationshipStore.getState().reset()
    useAccountStore.getState().reset()
    useRelationshipStore.getState().setPartner({ id: 'partner-1', name: 'Jordan' })
    useRelationshipStore.getState().connect()
    useAccountStore.getState().setLifecycle(connected)
    service.requestUnpair.mockResolvedValue({ ok: true, value: pending })
    service.cancelUnpair.mockResolvedValue({ ok: true, value: connected })
  })

  it('starts the real grace-period lifecycle without clearing the partner', async () => {
    const user = userEvent.setup()
    await renderScreen(<PartnerScreen />)

    await user.press(screen.getByRole('button', { name: COPY.unlink }))
    await user.press(screen.getByRole('button', { name: COPY.unlinkConfirm }))

    await waitFor(() => expect(service.requestUnpair).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(COPY.unlinkPending)).toBeTruthy()
    expect(screen.getByText(/October 19, 2026/)).toBeTruthy()
    expect(useRelationshipStore.getState().partner?.name).toBe('Jordan')
  })

  it('cancels a pending unlink request', async () => {
    useAccountStore.getState().setLifecycle(pending)
    const user = userEvent.setup()
    await renderScreen(<PartnerScreen />)

    await user.press(screen.getByRole('button', { name: COPY.cancelUnlink }))

    await waitFor(() => expect(service.cancelUnpair).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(COPY.cancelUnlinkComplete)).toBeTruthy()
    expect(useAccountStore.getState().lifecycle).toEqual(connected)
  })

  it('keeps the relationship intact when the lifecycle request fails', async () => {
    service.requestUnpair.mockResolvedValueOnce({ ok: false, error: { code: 'NETWORK' } })
    const user = userEvent.setup()
    await renderScreen(<PartnerScreen />)

    await user.press(screen.getByRole('button', { name: COPY.unlink }))
    await user.press(screen.getByRole('button', { name: COPY.unlinkConfirm }))

    expect(await screen.findByText(COPY.lifecycleError)).toBeTruthy()
    expect(useRelationshipStore.getState().partner?.name).toBe('Jordan')
    expect(useAccountStore.getState().lifecycle).toEqual(connected)
  })
})
