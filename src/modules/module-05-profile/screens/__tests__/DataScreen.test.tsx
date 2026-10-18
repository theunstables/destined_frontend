import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { SETTINGS_DATA_COPY as COPY } from '@/copy/settingsData'
import { deliverAccountExport } from '@/modules/module-05-profile/exportAccountData'
import { DataScreen } from '@/modules/module-05-profile/screens/DataScreen'
import { accountService } from '@/services/account'
import { usePreferencesStore } from '@/state/preferencesStore'
import { renderScreen } from '@/test/renderScreen'

jest.mock('@/config/env', () => ({ isMockMode: false }))
jest.mock('@/modules/module-05-profile/exportAccountData', () => ({
  deliverAccountExport: jest.fn(),
}))
jest.mock('@/services/account', () => ({
  accountService: { exportData: jest.fn() },
}))
jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}))

const service = jest.mocked(accountService)
const deliver = jest.mocked(deliverAccountExport)
const accountExport = {
  generatedAt: '2026-10-12T00:00:00Z',
  data: { profile: { displayName: 'Maya' }, memories: [] },
}

describe('DataScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usePreferencesStore.getState().reset()
    service.exportData.mockResolvedValue({ ok: true, value: accountExport })
    deliver.mockResolvedValue()
  })

  it('requests and delivers the account export', async () => {
    const user = userEvent.setup()
    await renderScreen(<DataScreen />)

    expect(screen.getByText(COPY.usageUnavailable)).toBeTruthy()
    await user.press(screen.getByRole('button', { name: COPY.download }))

    await waitFor(() => expect(service.exportData).toHaveBeenCalledTimes(1))
    expect(deliver).toHaveBeenCalledWith(accountExport)
    expect(await screen.findByText(COPY.downloadReady)).toBeTruthy()
  })

  it('reports provider failures without claiming the export is ready', async () => {
    service.exportData.mockResolvedValueOnce({ ok: false, error: { code: 'NETWORK' } })
    const user = userEvent.setup()
    await renderScreen(<DataScreen />)

    await user.press(screen.getByRole('button', { name: COPY.download }))

    expect(await screen.findByText(COPY.downloadError)).toBeTruthy()
    expect(deliver).not.toHaveBeenCalled()
    expect(screen.queryByText(COPY.downloadReady)).toBeNull()
  })

  it('reports delivery failures', async () => {
    deliver.mockRejectedValueOnce(new Error('Share cancelled'))
    const user = userEvent.setup()
    await renderScreen(<DataScreen />)

    await user.press(screen.getByRole('button', { name: COPY.download }))

    expect(await screen.findByText(COPY.downloadError)).toBeTruthy()
  })

  it('ignores duplicate presses while an export request is in flight', async () => {
    let resolveExport!: (value: Awaited<ReturnType<typeof accountService.exportData>>) => void
    service.exportData.mockImplementationOnce(() => new Promise((resolve) => {
      resolveExport = resolve
    }))
    const user = userEvent.setup()
    await renderScreen(<DataScreen />)
    const download = screen.getByRole('button', { name: COPY.download })

    await user.press(download)
    await user.press(download)

    expect(service.exportData).toHaveBeenCalledTimes(1)
    expect(screen.getByText(COPY.downloadPreparing)).toBeTruthy()

    resolveExport({ ok: true, value: accountExport })
    expect(await screen.findByText(COPY.downloadReady)).toBeTruthy()
  })
})