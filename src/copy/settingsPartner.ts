/**
 * Copy for Settings → Partner & Pairing.
 *
 * Unlinking is the heaviest thing in this cluster short of deletion, and the
 * confirmation says what actually happens rather than asking "are you sure?".
 * In a product for exactly two people, unlinking ends the shared space — the
 * person tapping it deserves to read that before they answer.
 */
export const SETTINGS_PARTNER_COPY = {
  title: 'Partner & Pairing',
  lede: 'Who you share this space with.',

  partnerGroup: 'Your partner',
  pairedSince: 'Paired since',
  noPartner: 'You have not paired with anyone yet.',
  invitePartner: 'Invite your partner',

  codeGroup: 'Your invite code',
  codeHint: 'Share this with your partner so they can find you.',
  shareCode: 'Share code',
  copyCode: 'Copy code',
  copied: 'Copied.',
  shareCopied: 'Your browser has no share sheet, so the invite is on your clipboard instead.',
  copyUnavailable: 'Copying needs a clipboard module this build does not have. Read it out, or share it.',

  dangerGroup: 'Ending it',
  unlink: 'Unlink partner',
  unlinkDetail: 'Pause sharing and start a seven-day grace period.',
  unlinkTitle: 'Unlink from your partner?',
  unlinkBody:
    'Sharing pauses now. The unlink completes after seven days unless either of you cancels it. Your shared records are not erased by this request.',
  unlinkCancel: 'Stay paired',
  unlinkConfirm: 'Start unlinking',
  unlinkPending: 'Unlinking is scheduled. Sharing is paused during the grace period.',
  unlinkRequestedByPartner: 'Your partner requested unlinking. Sharing is paused during the grace period.',
  unlinkDatePrefix: 'Scheduled for',
  cancelUnlink: 'Cancel unlink request',
  cancelUnlinkComplete: 'The unlink request was cancelled.',
  lifecycleError: 'The pairing change could not be saved. Try again.',
} as const
