import { screen, userEvent } from '@testing-library/react-native'

import { PairingChoiceCard } from '@/modules/module-01-onboarding/components/PairingChoiceCard'
import { renderScreen } from '@/test/renderScreen'

describe('PairingChoiceCard', () => {
  it('exposes the title as its action and the detail as its hint', async () => {
    const onPress = jest.fn()
    await renderScreen(
      <PairingChoiceCard
        icon="send"
        title="Invite My Partner"
        body="Create a private invitation."
        onPress={onPress}
      />,
    )

    const choice = screen.getByRole('button', { name: 'Invite My Partner' })
    expect(choice.props.accessibilityHint).toBe('Create a private invitation.')

    await userEvent.press(choice)
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})