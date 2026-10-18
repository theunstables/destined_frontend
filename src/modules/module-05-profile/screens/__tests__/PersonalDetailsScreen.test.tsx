import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { SETTINGS_PERSONAL_DETAILS_COPY as COPY } from '@/copy/settingsPersonalDetails'
import { PersonalDetailsScreen } from '@/modules/module-05-profile/screens/PersonalDetailsScreen'
import { pairingService } from '@/services/pairing'
import { useRelationshipStore } from '@/state/relationshipStore'
import { useSessionStore } from '@/state/sessionStore'
import { renderScreen } from '@/test/renderScreen'

jest.mock('@/config/env', () => ({ isMockMode: false }))
jest.mock('@/services/pairing', () => ({
  pairingService: { createProfile: jest.fn() },
}))
jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}))

const service = jest.mocked(pairingService)
const profile = {
  name: 'Maya',
  nickname: 'May',
  birthday: '1994-08-17',
  pronouns: 'she/her',
  photoUri: 'https://cdn.example/maya.jpg',
}

describe('PersonalDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useRelationshipStore.getState().reset()
    useSessionStore.getState().reset()
    useRelationshipStore.getState().setProfile(profile)
    useSessionStore.getState().signedIn({
      userId: 'user-1',
      email: 'maya@example.com',
      emailVerified: true,
    })
    service.createProfile.mockResolvedValue({ ok: true, value: profile })
  })

  it('shows the authenticated email without unsupported phone controls', async () => {
    await renderScreen(<PersonalDetailsScreen />)

    expect(screen.getByDisplayValue('maya@example.com')).toBeTruthy()
    expect(screen.queryByLabelText(COPY.phoneLabel)).toBeNull()
    expect(screen.queryByRole('button', { name: COPY.verifyAction })).toBeNull()
  })

  it('persists supported profile fields and synchronizes the provider response', async () => {
    const updated = { ...profile, name: 'Maya Rao', nickname: 'M' }
    service.createProfile.mockResolvedValueOnce({ ok: true, value: updated })
    const user = userEvent.setup()
    await renderScreen(<PersonalDetailsScreen />)

    await user.clear(screen.getByLabelText(COPY.nameLabel))
    await user.type(screen.getByLabelText(COPY.nameLabel), updated.name)
    await user.clear(screen.getByLabelText(COPY.nicknameLabel))
    await user.type(screen.getByLabelText(COPY.nicknameLabel), updated.nickname)
    await user.press(screen.getByRole('button', { name: COPY.save }))

    await waitFor(() => expect(service.createProfile).toHaveBeenCalledWith(expect.objectContaining({
      name: updated.name,
      nickname: updated.nickname,
      birthday: profile.birthday,
      pronouns: profile.pronouns,
      photoUri: profile.photoUri,
    })))
    expect(await screen.findByText(COPY.saved)).toBeTruthy()
    expect(useRelationshipStore.getState().profile).toEqual(updated)
  })

  it('keeps the existing profile and reports provider failures', async () => {
    service.createProfile.mockResolvedValueOnce({ ok: false, error: { code: 'NETWORK' } })
    const user = userEvent.setup()
    await renderScreen(<PersonalDetailsScreen />)

    await user.press(screen.getByRole('button', { name: COPY.save }))

    expect(await screen.findByText(COPY.saveError)).toBeTruthy()
    expect(useRelationshipStore.getState().profile).toEqual(profile)
  })
})
