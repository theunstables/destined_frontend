import { BRAND } from '@/config/brand'

/**
 * Copy for M01-S01 Relationship Setup. Figma 522:302.
 *
 * The lede interpolates `BRAND.name` rather than typing the product name: the
 * name is still provisional, and this is the rule that keeps a rename to one
 * file.
 */
export const RELATIONSHIP_SETUP_COPY = {
  eyebrow: 'Relationship Setup',
  heading: "Now let's create your space together.",
  lede: `Choose how you want to connect in ${BRAND.name}.`,
  invite: 'Invite My Partner',
  inviteBody: 'Create a private invitation.',
  haveCode: 'I Have a Partner Code',
  haveCodeBody: 'Enter their six characters.',
  /** Drawn as `#7A7583`; normalised to `text.body` per spec §5. */
  later: 'Do This Later',
  laterBody: 'Connect from Profile later.',
} as const
