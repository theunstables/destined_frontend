import { act, screen, userEvent } from '@testing-library/react-native'

import { VERIFY_EMAIL_COPY as COPY } from '@/copy/verifyEmail'
import { VerifyEmailScreen } from '@/modules/module-00-auth/screens/VerifyEmailScreen'
import { authService } from '@/services/auth'
import { useSessionStore } from '@/state/sessionStore'
import { renderScreen } from '@/test/renderScreen'

const mockBack = jest.fn()
const mockReplace = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, push: jest.fn(), back: mockBack, replace: mockReplace }),
}))

describe('VerifyEmailScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockBack.mockClear()
    mockReplace.mockClear()
    useSessionStore.getState().signedIn({
      userId: 'user-1',
      email: 'olivia@example.com',
      emailVerified: false,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('renders its blocks from copy', async () => {
    await renderScreen(<VerifyEmailScreen />)

    expect(screen.getByText(COPY.eyebrow)).toBeTruthy()
    expect(screen.getByText(COPY.heading)).toBeTruthy()
    expect(screen.getByText(COPY.lede)).toBeTruthy()
    expect(screen.getByRole('button', { name: COPY.resend })).toBeTruthy()
    expect(screen.getByRole('button', { name: COPY.changeEmail })).toBeTruthy()
  })

  it('starts the countdown on mount at the full cooldown', async () => {
    await renderScreen(<VerifyEmailScreen />)

    // 60 seconds formats as 01:00. Figma's 00:59 is one tick later.
    expect(screen.getByText('01:00')).toBeTruthy()
  })

  it('counts down each second', async () => {
    await renderScreen(<VerifyEmailScreen />)

    await act(async () => {
      jest.advanceTimersByTime(3000)
    })

    expect(screen.getByText('00:57')).toBeTruthy()
  })

  it('disables resend while the countdown runs', async () => {
    await renderScreen(<VerifyEmailScreen />)

    expect(
      screen.getByRole('button', { name: COPY.resend }).props.accessibilityState,
    ).toMatchObject({ disabled: true })
  })

  it('enables resend and drops the timer at zero', async () => {
    await renderScreen(<VerifyEmailScreen />)

    await act(async () => {
      jest.advanceTimersByTime(60_000)
    })

    expect(
      screen.getByRole('button', { name: COPY.resend }).props.accessibilityState,
    ).toMatchObject({ disabled: false })
    expect(screen.queryByText(/^\d\d:\d\d$/)).toBeNull()
  })

  it('leads on into onboarding instead of dead-ending', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    await renderScreen(<VerifyEmailScreen />)

    await user.press(screen.getByRole('button', { name: COPY.continue }))

    // replace, not push: returning to "check your inbox" after pairing has
    // begun is nonsense.
    expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/setup')
  })

  it('goes back when Change Email is pressed', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    await renderScreen(<VerifyEmailScreen />)

    // There is no change-email design, so this returns to Create Account rather
    // than inventing a sixth screen.
    await user.press(screen.getByRole('button', { name: COPY.changeEmail }))

    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('restarts the cooldown after a successful resend', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    await renderScreen(<VerifyEmailScreen />)

    await act(async () => {
      jest.advanceTimersByTime(60_000)
    })

    await user.press(screen.getByRole('button', { name: COPY.resend }))

    // The mock's own latency has to elapse before the cooldown resets.
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(
      screen.getByRole('button', { name: COPY.resend }).props.accessibilityState,
    ).toMatchObject({ disabled: true })
  })

  it('resends verification to the signed-in address instead of a blank value', async () => {
    const resend = jest.spyOn(authService, 'resendVerification')
    useSessionStore.getState().signedIn({
      userId: 'user-1',
      email: 'olivia@example.com',
      emailVerified: false,
    })
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    await renderScreen(<VerifyEmailScreen />)

    await act(async () => {
      jest.advanceTimersByTime(60_000)
    })
    await user.press(screen.getByRole('button', { name: COPY.resend }))

    expect(resend).toHaveBeenCalledWith({ email: 'olivia@example.com' })
  })

  it('never calls resend with an empty placeholder when the session is missing', async () => {
    const resend = jest.spyOn(authService, 'resendVerification')
    useSessionStore.getState().reset()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    await renderScreen(<VerifyEmailScreen />)

    await act(async () => {
      jest.advanceTimersByTime(60_000)
    })
    await user.press(screen.getByRole('button', { name: COPY.resend }))

    expect(resend).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(COPY.missingSession)
  })

  it('continues when resend reports that the account is already verified', async () => {
    jest.spyOn(authService, 'resendVerification').mockResolvedValueOnce({
      ok: false,
      error: { code: 'EMAIL_ALREADY_VERIFIED' },
    })
    useSessionStore.getState().signedIn({
      userId: 'user-1',
      email: 'olivia@example.com',
      emailVerified: false,
    })
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    await renderScreen(<VerifyEmailScreen />)

    await act(async () => {
      jest.advanceTimersByTime(60_000)
    })
    await user.press(screen.getByRole('button', { name: COPY.resend }))

    expect(useSessionStore.getState().session?.emailVerified).toBe(true)
    expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/setup')
  })
})
