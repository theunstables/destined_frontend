/**
 * Copy for M01-S07 Connecting. Figma 522:738.
 *
 * The drawn "just a moment" node uses Bricolage Grotesque at body size, which
 * is a Figma slip rather than intent (D34). The words are kept; the face is not.
 */
export const CONNECTING_COPY = {
  eyebrow: 'Connecting',
  heading: 'Creating your shared space…',
  lede: 'Bringing both sides together securely.',
  errorEyebrow: 'Connection Error',
  errorHeading: 'Connection paused',
  errorLede: 'Your information is safe. Try once more.',
  retry: 'Try Again',
  returnToCode: 'Return to Code',
  errors: {
    CODE_INVALID: 'Something went wrong. Try again.',
    CODE_EXPIRED: 'That invitation has expired. Ask your partner for a new one.',
    CANNOT_PAIR_WITH_SELF: 'Something went wrong. Try again.',
    ALREADY_PAIRED: 'This account is already connected. Reopen the app to restore your space.',
    EMAIL_NOT_VERIFIED: 'Verify your email before connecting with your partner.',
    NETWORK: 'No connection. Check your network and try again.',
    UNKNOWN: 'Something went wrong. Try again.',
  },
} as const
