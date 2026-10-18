/**
 * Copy for the calendar screen — reached from a "Little things" reminder, and
 * from "Add an Important Date" on the dashboard's empty state.
 *
 * NO FIGMA FRAME EXISTS. The pinned note in the Figma file lists "Calendar",
 * "Notes" and "Any other events they wish to pin" as home-screen features, so
 * this screen realises that note using the app's existing components.
 */
export const CALENDAR_COPY = {
  title: 'Our calendar',
  eyebrow: 'Your shared world',
  lede: 'The dates, plans, and little things that belong to both of you.',
  weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  monthLabel: (month: string, year: number) => `${month} ${year}`,
  prev: 'Previous month',
  next: 'Next month',
  agendaLabel: 'This month',
  agendaEmpty: 'Nothing on the calendar this month.',
  remindersLabel: 'Little things',
  remindersEmpty: 'No reminders pinned yet.',
  loading: 'Gathering your shared dates…',
  error: 'Your calendar could not be refreshed right now.',
  retry: 'Try Again',
  eventLegend: 'Birthdays, anniversaries, and plans',
  addDate: 'Add an Important Date',
  writeNote: 'Write a Note',
  today: 'Today',
  back: 'Back home',
  form: {
    newHeading: 'Add an important date',
    editHeading: 'Edit this date',
    titleLabel: 'What is the occasion?',
    titlePlaceholder: 'Dinner, anniversary, trip…',
    titleRequired: 'Give this date a name.',
    dateLabel: 'When is it?',
    dateRequired: 'Add a valid date.',
    locationLabel: 'Location (Optional)',
    locationPlaceholder: 'Add a place',
    notesLabel: 'Notes (Optional)',
    notesPlaceholder: 'Anything you both should remember…',
    repeats: 'Repeat every year',
    create: 'Save Important Date',
    update: 'Save Changes',
    cancel: 'Cancel',
    saveError: 'That date could not be saved. Try again.',
    missing: 'That calendar event could not be found.',
  },
} as const
