/**
 * Copy for M00-S04 Verify Email.
 *
 * The emoji is in the design and stays: it carries tone a lavender palette alone
 * does not.
 */
export const VERIFY_EMAIL_COPY = {
  eyebrow: 'Secure your world',
  heading: 'Check your inbox 💌',
  lede: 'We sent a verification link to your email.',
  resend: 'Resend Email',
  changeEmail: 'Change Email',
  /**
   * The forward exit into M01. Until a real provider reports `emailVerified`,
   * this is the user asserting they have followed the link.
   */
  continue: "I've Verified",
  checking: 'Checking verification…',
  notVerified: 'We cannot confirm the link yet. Open it from your email, then try again.',
  missingSession: 'Your sign-in session is missing. Return to Create Account and sign in again.',
  /** Figma shows 00:59 — one tick into a 60-second cooldown. */
  resendCooldownSeconds: 60,
} as const
