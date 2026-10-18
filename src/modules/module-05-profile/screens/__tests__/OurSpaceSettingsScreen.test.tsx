import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { SETTINGS_OUR_SPACE_COPY as COPY } from '@/copy/settingsOurSpace'
import { OurSpaceSettingsScreen } from '@/modules/module-05-profile/screens/OurSpaceSettingsScreen'
import { pairingService } from '@/services/pairing'
import { useSpaceStore } from '@/state/spaceStore'
import { renderScreen } from '@/test/renderScreen'

jest.mock('@/services/pairing', () => ({
  pairingService: { updateSpace: jest.fn() },
}))
jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}))

const service = jest.mocked(pairingService)
const updatedSpace = {
  coupleId: 'couple-1',
  name: 'Maya & Jordan',
  shortName: 'M + J',
  coverStyle: 'dawn' as const,
  status: 'connected' as const,
}

describe('OurSpaceSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useSpaceStore.getState().reset()
    service.updateSpace.mockResolvedValue({ ok: true, value: updatedSpace })
  })

  it('persists changes and synchronizes the authoritative shared space', async () => {
    const user = userEvent.setup()
    await renderScreen(<OurSpaceSettingsScreen />)

    await user.type(screen.getByLabelText(COPY.nameLabel), updatedSpace.name)
    await user.type(screen.getByLabelText(COPY.shortNameLabel), updatedSpace.shortName)
    await user.press(screen.getByRole('button', { name: COPY.save }))

    await waitFor(() => expect(service.updateSpace).toHaveBeenCalledWith({
      name: updatedSpace.name,
      shortName: updatedSpace.shortName,
      coverStyle: 'dawn',
    }))
    expect(await screen.findByText(COPY.saved)).toBeTruthy()
    expect(useSpaceStore.getState()).toMatchObject({
      name: updatedSpace.name,
      shortName: updatedSpace.shortName,
      coverStyle: updatedSpace.coverStyle,
    })
  })

  it('preserves local state and reports a provider failure', async () => {
    useSpaceStore.getState().setSpace({ name: 'Before', shortName: 'B', coverStyle: 'night' })
    service.updateSpace.mockResolvedValueOnce({ ok: false, error: { code: 'NETWORK' } })
    const user = userEvent.setup()
    await renderScreen(<OurSpaceSettingsScreen />)

    await user.press(screen.getByRole('button', { name: COPY.save }))

    expect(await screen.findByText(COPY.saveError)).toBeTruthy()
    expect(useSpaceStore.getState()).toMatchObject({
      name: 'Before',
      shortName: 'B',
      coverStyle: 'night',
    })
  })

  it('blocks an empty required name before calling the provider', async () => {
    const user = userEvent.setup()
    await renderScreen(<OurSpaceSettingsScreen />)

    await user.press(screen.getByRole('button', { name: COPY.save }))

    expect(await screen.findByText(COPY.nameRequired)).toBeTruthy()
    expect(service.updateSpace).not.toHaveBeenCalled()
  })
})