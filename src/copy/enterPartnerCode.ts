/**
 * Copy for M01-S04 Enter Partner Code. Figma 522:461.
 *
 * Every error names its own problem. A single generic failure would leave a
 * user retyping a code that is expired, or one that is their own, with no way
 * to tell which (spec §10).
 */
export const ENTER_CODE_COPY = {
  eyebrow: 'Enter Partner Code',
  heading: 'Your person invited you ❤️',
  lede: 'Enter the six characters your partner shared with you.',
  codeLabel: 'Partner code',
  submit: 'Connect',
  needInvite: 'I need an invitation',
  invalidTitle: 'That code did not work.',
  invalidBody: 'Correct it without starting over.',
  errors: {
    CODE_INVALID: 'That code does not exist. Check it and try again.',
    CODE_EXPIRED: 'That invitation has expired. Ask your partner for a new one.',
    CANNOT_PAIR_WITH_SELF: 'That is your own code. Share it with your partner instead.',
    ALREADY_PAIRED: 'This account is already connected. Reopen the app to restore your space.',
    EMAIL_NOT_VERIFIED: 'Verify your email before connecting with your partner.',
    NETWORK: 'No connection. Check your network and try again.',
    UNKNOWN: 'Something went wrong. Try again.',
  },
} as const
