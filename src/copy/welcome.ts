import { BRAND } from '@/config/brand'

/**
 * Copy for M00-S01 Welcome.
 *
 * Screen copy lives here; brand identity lives in `@/config/brand`. The
 * headline and tagline are kept in step with the brand config. The assertion
 * below catches stale welcome copy during development.
 */
export const WELCOME_COPY = {
  eyebrow: 'One private world for two',
  headlineLines: ['Destined'],
  subtitleLines: ['Where two stories become ours.'],
  primaryCta: 'Get Started',
  secondaryText: 'Already have an account?',
  secondaryLink: 'Sign In',
  privacyNote: 'Your space belongs to both of you.',
} as const

if (
  __DEV__ &&
  (WELCOME_COPY.headlineLines.join(' ') !== BRAND.name ||
    WELCOME_COPY.subtitleLines.join(' ') !== BRAND.tagline)
) {
  throw new Error(
    `Welcome copy has drifted from the brand config.\n` +
      `  headlineLines → "${WELCOME_COPY.headlineLines.join(' ')}" (expected BRAND.name "${BRAND.name}")\n` +
      `  subtitleLines → "${WELCOME_COPY.subtitleLines.join(' ')}" (expected BRAND.tagline "${BRAND.tagline}")`,
  )
}
