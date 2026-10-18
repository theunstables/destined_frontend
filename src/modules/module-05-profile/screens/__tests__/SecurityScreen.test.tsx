import { screen } from '@testing-library/react-native'

import { SETTINGS_SECURITY_COPY as COPY } from '@/copy/settingsSecurity'
import { SecurityScreen } from '@/modules/module-05-profile/screens/SecurityScreen'
import { renderScreen } from '@/test/renderScreen'

jest.mock('@/config/env', () => ({ isMockMode: false }))
jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}))

describe('SecurityScreen in an API-backed build', () => {
  it('does not present simulated security or remote-session operations', async () => {
    await renderScreen(<SecurityScreen />)

    expect(screen.getByText(COPY.sessionsUnavailable)).toBeTruthy()
    expect(screen.queryByRole('switch', { name: COPY.twoFactor })).toBeNull()
    expect(screen.queryByRole('button', { name: COPY.signOutAll })).toBeNull()
    expect(screen.getByText(`${COPY.twoFactorDetail} ${COPY.unavailable}`)).toBeTruthy()
  })
})
