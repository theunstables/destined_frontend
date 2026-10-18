export const TIMELINE_COPY = {
  eyebrow: 'The story of your two worlds',
  heading: 'Our timeline',
  lede: 'The memories, milestones, and days that became part of your story.',
  homeHeading: 'Your story, in order',
  homeLede: (count: number) =>
    count === 1 ? '1 moment lives on your timeline.' : `${count} moments live on your timeline.`,
  homeEmpty: 'Your first shared moment will begin the timeline.',
  open: 'Open Our Timeline',
  loadMore: 'Reveal Earlier Moments',
  openMoment: 'Open moment',
  empty: {
    heading: 'Your timeline is waiting',
    lede: 'Add a memory or a meaningful date and your shared story will begin here.',
    action: 'Add Your First Memory',
  },
  errors: {
    NETWORK: 'No connection. Check your network and try again.',
    UNKNOWN: 'Your timeline could not be loaded. Try again.',
  },
  retry: 'Try Again',
  olderError: 'Earlier moments could not be loaded. Try again.',
  types: {
    memory: 'Memory',
    calendar: 'Shared date',
    story: 'Our story',
    occasion: 'Occasion',
  },
} as const