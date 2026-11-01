import { BRAND } from '@/config/brand'

/**
 * Copy for M00-S01 Welcome.
 *
 * Screen copy lives here; brand identity lives in `@/config/brand`. The
 * product name is shown as the main headline, while the product tagline is the
 * supporting subtitle. The assertions below keep both values honest: if either
 * source drifts, the app fails loudly in development instead of quietly
 * rendering stale copy.
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

if (__DEV__) {
  const headline = WELCOME_COPY.headlineLines.join(' ')
  const subtitle = WELCOME_COPY.subtitleLines.join(' ')

  if (headline !== BRAND.name) {
    throw new Error(
      `Welcome headline has drifted from BRAND.name.\n` +
        `  headlineLines → "${headline}"\n` +
        `  BRAND.name → "${BRAND.name}"`,
    )
  }

  if (subtitle !== BRAND.tagline) {
    throw new Error(
      `Welcome subtitle has drifted from BRAND.tagline.\n` +
        `  subtitleLines → "${subtitle}"\n` +
        `  BRAND.tagline → "${BRAND.tagline}"`,
    )
  }
}
