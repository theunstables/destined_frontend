import { screen } from '@testing-library/react-native'

import { AuthEyebrow } from '@/modules/module-00-auth/components/AuthEyebrow'
import { renderScreen } from '@/test/renderScreen'

describe('AuthEyebrow', () => {
  it('renders narrative metadata', async () => {
    await renderScreen(<AuthEyebrow>Account recovery</AuthEyebrow>)

    expect(screen.getByText('Account recovery')).toBeTruthy()
  })

  it('supports centred status metadata', async () => {
    await renderScreen(<AuthEyebrow align="center">All set</AuthEyebrow>)

    expect(screen.getByText('All set').props.style).toEqual(
      expect.objectContaining({ textAlign: 'center' }),
    )
  })
})