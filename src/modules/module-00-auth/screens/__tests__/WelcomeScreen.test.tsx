import { screen } from '@testing-library/react-native'

import { WELCOME_COPY } from '@/copy/welcome'
import { lavenderTheme } from '@/design-system/themes/theme'
import { WelcomeScreen } from '@/modules/module-00-auth/screens/WelcomeScreen'
import { renderScreen } from '@/test/renderScreen'

jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}))

describe('WelcomeScreen', () => {
  it('renders the headline and both calls to action', async () => {
    await renderScreen(<WelcomeScreen />)

    expect(screen.getByText(WELCOME_COPY.headlineLines[0])).toBeTruthy()
    expect(screen.getByRole('button', { name: WELCOME_COPY.primaryCta })).toBeTruthy()
    expect(screen.getByRole('link', { name: WELCOME_COPY.secondaryLink })).toBeTruthy()
  })

  /**
  * The reveal fills the wide presentation column while actions remain in the
  * intentionally tighter interaction column.
   */
  it.each([320, 430])('keeps every content block fluid at a %dpt frame', async (width) => {
    await renderScreen(<WelcomeScreen />, { width })

    const content = screen.getByTestId('welcome-content')
    const actions = screen.getByTestId('welcome-actions')

    expect(content.props.style.width).toBe('100%')
    expect(content.props.style.maxWidth).toBe(lavenderTheme.layout.columnWide)

    expect(actions.props.style.width).toBe('100%')
    expect(actions.props.style.maxWidth).toBe(lavenderTheme.layout.columnNarrow)

    expect(screen.getByTestId('two-worlds-reveal')).toBeTruthy()
    expect(lavenderTheme.layout.columnNarrow).toBeLessThan(lavenderTheme.layout.columnWide)
  })
})
