import { BRAND } from '@/config/brand'

/** Copy for M00-S05 Forgot Password. */
export const FORGOT_PASSWORD_COPY = {
  eyebrow: 'Account recovery',
  heading: "Let's get you back in.",
  lede: "Enter your email and we'll send you a secure reset link.",
  emailLabel: 'Email address',
  emailPlaceholder: `hello@${BRAND.domain}`,
  submit: 'Send Reset Link',
  backToSignIn: 'Back to Sign In',

  sentHeading: 'Check your email',
  /**
   * Deliberately does NOT confirm whether the address has an account.
   * Confirming it would be account enumeration.
   */
  sentLede: (email: string) => `If ${email} has an account, a reset link is on its way.`,
  resend: 'Resend',
  privacyTitle: 'Private by design',
  privacyBody: 'Account recovery never exposes whether an address belongs to an account.',
  sentCardTitle: 'Link sent securely',
  sentCardBody: 'Only the person with access to that inbox can continue.',
} as const
