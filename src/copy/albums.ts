/**
 * Copy for the two album screens — Figma `Ziyu`, Memories Page frames 2 and 3.
 *
 * Both were designed and neither existed in code: "Your albums" was reachable
 * from a "VIEW ALL" the Memories home never had, and "Album Detail" had no
 * route at all.
 */
export const ALBUMS_COPY = {
  list: {
    eyebrow: 'Chandu & Sweatcha',
    heading: 'Your albums',
    /** Under each cover: "86 memories". */
    count: (n: number) => (n === 1 ? '1 memory' : `${n} memories`),
    empty: 'Your albums fill up as you tag memories.',
    error: 'Your albums could not be loaded. Try again.',
    create: 'Create album',
  },
  create: {
    eyebrow: 'A place for your moments',
    heading: 'Create an album',
    nameLabel: 'Album name',
    namePlaceholder: 'Weekend escapes',
    nameRequired: 'Give this album a name.',
    nameTooLong: 'Keep the album name to 60 characters.',
    emojiLabel: 'Emoji (Optional)',
    emojiPlaceholder: '✈️',
    emojiTooLong: 'Keep the emoji to 8 characters.',
    photoLabel: 'Add a cover photo',
    submit: 'Create Album',
    cancel: 'Cancel',
    errors: {
      CONFLICT: 'An album with that name already exists.',
      NOT_FOUND: 'Something went wrong. Try again.',
      NETWORK: 'No connection. Check your network and try again.',
      UNKNOWN: 'That album could not be created. Try again.',
    },
  },
  picker: {
    heading: 'Add to an album',
    loading: 'Loading your albums…',
    empty: 'Create an album first, then add this memory.',
    create: 'Create a new album',
    cancel: 'Cancel',
    success: (label: string) => `Added to ${label}.`,
    error: 'That memory could not be added. Try again.',
  },
  detail: {
    /** Hero subtitle: "32 memories · Chandu & Sweatcha". */
    subtitle: (n: number, couple: string) =>
      `${n === 1 ? '1 memory' : `${n} memories`} · ${couple}`,
    empty: 'Nothing in this album yet.',
    back: 'Back to albums',
    more: 'Album options',
    missing: 'That album could not be found.',
    loadError: 'That album could not be loaded. Try again.',
    remove: 'Remove from album',
    removeError: 'That memory could not be removed. Try again.',
  },
} as const
