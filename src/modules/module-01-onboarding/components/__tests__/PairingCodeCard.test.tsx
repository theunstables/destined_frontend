import { screen } from '@testing-library/react-native'

import { PairingCodeCard } from '@/modules/module-01-onboarding/components/PairingCodeCard'
import { renderScreen } from '@/test/renderScreen'

describe('PairingCodeCard', () => {
  it('groups the label, readable code, and lifecycle status', async () => {
    await renderScreen(
      <PairingCodeCard
        label="YOUR UNIQUE CODE"
        code="L8V7QK"
        status="VALID UNTIL YOU CANCEL"
      />,
    )

    expect(screen.getByText('YOUR UNIQUE CODE')).toBeTruthy()
    expect(screen.getByLabelText('L 8 V 7 Q K')).toBeTruthy()
    expect(screen.getByText('VALID UNTIL YOU CANCEL')).toBeTruthy()
  })

  it('keeps the secure surface stable while a code is being issued', async () => {
    await renderScreen(
      <PairingCodeCard
        label="YOUR UNIQUE CODE"
        code={null}
        status="VALID UNTIL YOU CANCEL"
      />,
    )

    expect(screen.getByText('YOUR UNIQUE CODE')).toBeTruthy()
    expect(screen.queryByLabelText('L 8 V 7 Q K')).toBeNull()
  })
})