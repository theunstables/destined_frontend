/**
 * Copy for Module 03 — Memories. Stitch screens 7b08f9eb, b1a46956, b5e4bef3,
 * 510bd9c6, 17b6f431.
 *
 * The designs show a populated library — "186 little pieces of us", collections
 * of 86 / 32 / 24 / 12 items, a Rome trip. None of that is reproduced: the
 * counts are computed, and a couple with no memories sees the empty state,
 * which is what the "Empty Memories State" frame draws anyway.
 */
export const MEMORIES_COPY = {
  home: {
    heading: 'Our memories',
    /** Interpolated with the real count. */
    count: (n: number) => (n === 1 ? '1 little piece of us.' : `${n} little pieces of us.`),
    search: 'Search memories',
    add: 'Add Memory',
    /**
     * The design says "Your albums", so the app does too. Was
     * `collectionsLabel: 'Collections'` — two names for one concept, and the
     * frame's name wins.
     */
    albumsLabel: 'Your albums',
    viewAll: 'View all',
    onThisDayLabel: 'On this day',
    favoritesLabel: 'Favorites',
    recentlyAddedLabel: 'Recently added',
    yesterday: 'Yesterday',
    voiceNote: 'Voice note',
  },
  empty: {
    heading: 'Your memories are waiting. ❤️',
    lede: 'Everything you keep here belongs to both of you.',
    addFirst: 'Add Your First Memory',
  },
  detail: {
    title: 'Memory Detail',
    favorite: 'Favorite',
    unfavorite: 'Remove from favorites',
    noteLabel: 'Our Note',
    addedBy: (name: string) => `Added by ${name}`,
    missing: 'That memory could not be found.',
    back: 'Back to memories',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: {
      title: 'Delete this memory?',
      body: 'This cannot be undone.',
      confirm: 'Delete',
      cancel: 'Keep it',
    },
    privateNotes: {
      eyebrow: 'Just between your two worlds',
      heading: 'What this memory means to me',
      lede: 'Write separately. Your notes are revealed only after both of you have shared.',
      inputLabel: 'Your private note',
      placeholder: 'Write what you remember or felt…',
      save: 'Seal My Note',
      update: 'Update My Note',
      edit: 'Edit My Note',
      withdraw: 'Withdraw My Note',
      waitingTitle: 'Your note is sealed',
      waitingBody: 'Your partner cannot read it until they share their own note.',
      revealedTitle: 'Both notes are open',
      myNote: 'My note',
      partnerNote: 'My partner’s note',
      required: 'Write a note before sealing it.',
      error: 'Your note could not be saved. Try again.',
      withdrawError: 'Your note could not be withdrawn. Try again.',
      withdrawConfirm: {
        title: 'Withdraw your note?',
        body: 'Both notes will become private again until you share another note.',
        confirm: 'Withdraw',
        cancel: 'Keep Both Open',
      },
    },
    errors: {
      CONFLICT: 'That change conflicts with something your partner just updated. Try again.',
      NOT_FOUND: 'That memory could not be found.',
      NETWORK: 'No connection. Check your network and try again.',
      UNKNOWN: 'Something went wrong. Try again.',
    },
  },
  edit: {
    heading: 'Edit this memory',
    submit: 'Save Changes',
  },
  favorites: {
    heading: 'Favorites',
    empty: 'Nothing favorited yet.',
  },
  add: {
    heading: 'Add a memory',
    photoLabel: 'Tap to add photo',
    titleLabel: 'Title',
    titlePlaceholder: 'Give it a name',
    titleRequired: 'Give this memory a name',
    dateLabel: 'When was it?',
    dateRequired: 'Choose when this memory happened',
    captionLabel: 'Caption',
    captionPlaceholder: 'Write a caption…',
    locationLabel: 'Location (Optional)',
    locationPlaceholder: 'Add location',
    noteLabel: 'Our Note (Optional)',
    notePlaceholder: 'Only the two of you will see this',
    submit: 'Save Memory',
    cancel: 'Cancel',
    errors: {
      CONFLICT: 'That memory could not be saved. Try again.',
      NOT_FOUND: 'Something went wrong. Try again.',
      NETWORK: 'No connection. Check your network and try again.',
      UNKNOWN: 'Something went wrong. Try again.',
    },
  },
  search: {
    label: 'Search your memories',
    placeholder: 'Search your memories',
    resultsLabel: (n: number) => (n === 1 ? '1 memory' : `${n} memories`),
    none: 'Nothing matched that.',
    prompt: 'Type to search your memories.',
    emptyLibrary: 'There is nothing to search yet.',
  },
} as const
