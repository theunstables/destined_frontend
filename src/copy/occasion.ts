/**
 * Copy for the occasion screen — reached by tapping a "Coming up" row on the
 * dashboard.
 *
 * NO FIGMA FRAME EXISTS for this screen. The dashboard drew rows that were not
 * doors to anywhere, so this page is designed from the app's own system rather
 * than matched to a drawing. Its actions are the two the birthday spotlight
 * already draws, so nothing here invents new vocabulary.
 */
export const OCCASION_COPY = {
  eyebrow: 'A day in your shared world',
  countdown: (days: number) =>
    days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`,
  onDate: (date: string) => `on ${date}`,
  /** Both lifted from the dashboard's birthday spotlight. */
  planSurprise: 'Plan a Surprise',
  createCard: 'Create Birthday Card',
  addMemory: 'Add a memory for this day',
  pastLabel: 'From birthdays past',
  pastEmpty: 'Nothing kept from this day yet.',
  detailsLabel: 'About this day',
  calendar: 'See the whole calendar',
  missing: 'That date could not be found.',
  back: 'Back home',
  edit: 'Edit this date',
  delete: 'Delete this date',
  deleteConfirm: {
    title: 'Delete this date?',
    body: 'It will disappear from your shared calendar and upcoming dates.',
    confirm: 'Delete',
    cancel: 'Keep it',
  },
  deleteError: 'That date could not be deleted. Try again.',
} as const
