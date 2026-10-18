import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { PERSONALIZE_SPACE_COPY } from '@/copy/personalizeSpace'
import { READY_TO_COME_HOME_COPY } from '@/copy/readyToComeHome'
import { WELCOME_HOME_COPY } from '@/copy/welcomeHome'
import { PersonalizeSpaceScreen } from '@/modules/module-01-onboarding/screens/PersonalizeSpaceScreen'
import { ReadyToComeHomeScreen } from '@/modules/module-01-onboarding/screens/ReadyToComeHomeScreen'
import { WelcomeHomeScreen } from '@/modules/module-01-onboarding/screens/WelcomeHomeScreen'
import { useSpaceStore } from '@/state/spaceStore'
import { renderScreen } from '@/test/renderScreen'

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    canGoBack: () => true,
    push: mockPush,
    back: jest.fn(),
    replace: mockReplace,
  }),
}))

beforeEach(() => {
  mockPush.mockClear()
  mockReplace.mockClear()
  useSpaceStore.getState().reset()
})

describe('O10 Personalize Space', () => {
  it('shows the approved hierarchy and visual cover choices', async () => {
    await renderScreen(<PersonalizeSpaceScreen />)

    expect(screen.getByText(PERSONALIZE_SPACE_COPY.eyebrow)).toBeTruthy()
    expect(screen.getByText(PERSONALIZE_SPACE_COPY.heading)).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Dawn' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Dusk' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Night' })).toBeTruthy()
  })

  it('requires a space name before saving', async () => {
    await renderScreen(<PersonalizeSpaceScreen />)

    await userEvent.press(screen.getByRole('button', { name: PERSONALIZE_SPACE_COPY.submit }))

    expect(await screen.findByText(PERSONALIZE_SPACE_COPY.nameRequired)).toBeTruthy()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('stores the selected identity and advances', async () => {
    await renderScreen(<PersonalizeSpaceScreen />)

    await userEvent.type(
      screen.getByLabelText(PERSONALIZE_SPACE_COPY.nameLabel),
      'Olivia & Jordan',
    )
    await userEvent.press(screen.getByRole('radio', { name: 'Night' }))
    await userEvent.press(screen.getByRole('button', { name: PERSONALIZE_SPACE_COPY.submit }))

    await waitFor(() => {
      expect(useSpaceStore.getState()).toMatchObject({
        name: 'Olivia & Jordan',
        coverStyle: 'night',
      })
    })
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/ready-to-come-home')
  })
})

describe('O11 Ready to Come Home', () => {
  it('uses the real shared-world state and advances', async () => {
    await renderScreen(<ReadyToComeHomeScreen />)

    expect(screen.getByText(READY_TO_COME_HOME_COPY.eyebrow)).toBeTruthy()
    expect(screen.getByRole('image', { name: 'Your shared world' })).toBeTruthy()

    await userEvent.press(screen.getByRole('button', { name: READY_TO_COME_HOME_COPY.submit }))
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/welcome-home')
  })
})

describe('O12 Welcome Home', () => {
  it('replaces onboarding with Home', async () => {
    await renderScreen(<WelcomeHomeScreen />)

    expect(screen.getByText(WELCOME_HOME_COPY.eyebrow)).toBeTruthy()
    expect(screen.getByText(WELCOME_HOME_COPY.heading)).toBeTruthy()

    await userEvent.press(screen.getByRole('button', { name: WELCOME_HOME_COPY.submit }))
    expect(mockReplace).toHaveBeenCalledWith('/(app)/home')
  })
})