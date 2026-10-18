import { screen, userEvent } from '@testing-library/react-native'

import { PAIR_LATER_COPY as COPY } from '@/copy/pairLater'
import { PairLaterScreen } from '@/modules/module-01-onboarding/screens/PairLaterScreen'
import { useRelationshipStore } from '@/state/relationshipStore'
import { renderScreen } from '@/test/renderScreen'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, push: mockPush, back: jest.fn(), replace: jest.fn() }),
}))

describe('PairLaterScreen', () => {
  beforeEach(() => {
    mockPush.mockClear()
    useRelationshipStore.getState().reset()
  })

  it('explains that pairing remains available', async () => {
    await renderScreen(<PairLaterScreen />)

    expect(screen.getByText(COPY.eyebrow)).toBeTruthy()
    expect(screen.getByText(COPY.heading)).toBeTruthy()
    expect(screen.getByText(COPY.lede)).toBeTruthy()
    expect(screen.getByText(COPY.cardTitle)).toBeTruthy()
    expect(screen.getByText(COPY.cardBody)).toBeTruthy()
  })

  it('continues to the story without pairing', async () => {
    await renderScreen(<PairLaterScreen />)

    await userEvent.press(screen.getByRole('button', { name: COPY.continue }))

    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/story-begins')
  })

  it('lets the user return to the invitation path', async () => {
    await renderScreen(<PairLaterScreen />)

    await userEvent.press(screen.getByRole('button', { name: COPY.invite }))

    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/profile')
  })
})