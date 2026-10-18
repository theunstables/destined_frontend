/**
 * Copy for M00-S06 Reset Password. Stitch screen c2f89424.
 *
 * Two strings here are NOT in the Stitch design, because the design draws no
 * state for arriving without a token and none for the two passwords disagreeing
 * — both are reachable, so both need words. `missingTokenAction` is one; the
 * mismatch message is the other, and lives in `authSchemas` beside the rule that
 * produces it, as every other validation message does. Both are kept plain
 * rather than inventing a voice for them.
 */
export const RESET_PASSWORD_COPY = {
  eyebrow: 'Account recovery',
  heading: 'Create a new password',
  lede: 'Your new password must be unique from those previously used.',

  newPasswordLabel: 'New Password',
  confirmLabel: 'Confirm Password',
  /** The design masks both fields with dots rather than prompting with words. */
  passwordPlaceholder: '••••••••',

  strengthLabel: 'Password Strength',
  strengthLevels: {
    weak: 'Weak',
    fair: 'Fair',
    strong: 'Strong',
  },

  submit: 'Update Password',

  successHeading: 'Password updated ❤️',
  successLede: 'Sign in with your new password to continue.',
  /**
   * Goes to sign in, not into the app. The contract revokes every refresh
  * session on reset and returns no tokens, so there is no session to continue
  * into.
   */
  successAction: 'Return to Sign In',
  successEyebrow: 'All set',

  /** NOT IN THE DESIGN. Reachable by opening the screen without a token. */
  missingTokenAction: 'Request a new link',

  /**
   * Overrides for codes that mean something narrower here than they do
   * generally. A reset token is a link the user followed, not the session they
   * are holding, so the shared "your session has ended" is wrong on this screen.
   */
  errors: {
    TOKEN_INVALID: 'This reset link is no longer valid. Request a new one.',
    TOKEN_EXPIRED: 'This reset link has expired. Request a new one.',
  },
} as const
