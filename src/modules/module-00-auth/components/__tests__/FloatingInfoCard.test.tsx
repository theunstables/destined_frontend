import { screen } from '@testing-library/react-native'

import { FloatingInfoCard } from '@/modules/module-00-auth/components/FloatingInfoCard'
import { renderScreen } from '@/test/renderScreen'

describe('FloatingInfoCard', () => {
  it('renders an assurance without announcing an alert', async () => {
    await renderScreen(
      <FloatingInfoCard
        icon="lock"
        title="Private by design"
        body="Account recovery stays private."
      />,
    )

    expect(screen.getByText('Private by design')).toBeTruthy()
    expect(screen.getByText('Account recovery stays private.')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('announces error status content as an alert', async () => {
    await renderScreen(
      <FloatingInfoCard
        icon="alert-circle"
        title="Nothing was changed"
        body="Check your details and try again."
        tone="error"
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Nothing was changed')
    expect(screen.getByRole('alert')).toHaveTextContent('Check your details and try again.')
  })
})