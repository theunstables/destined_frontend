import * as Clipboard from 'expo-clipboard'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { FeedbackBanner, type FeedbackTone } from '@/components/feedback/FeedbackBanner'
import { CHAT_COPY } from '@/copy/chat'
import { PHOTO_PICK_COPY } from '@/copy/photoPick'
import { Overlay } from '@/design-system/patterns/Overlay'
import { mediaService } from '@/services/media'
import { ThemedStatusBar } from '@/design-system/patterns/ThemedStatusBar'
import { AttachmentSheet } from '@/modules/module-03-chat/components/AttachmentSheet'
import { ChatHeader } from '@/modules/module-03-chat/components/ChatHeader'
import { Composer } from '@/modules/module-03-chat/components/Composer'
import { DayDivider } from '@/modules/module-03-chat/components/DayDivider'
import { MessageBubble } from '@/modules/module-03-chat/components/MessageBubble'
import { MessageContextMenu } from '@/modules/module-03-chat/components/MessageContextMenu'
import { PhotoSharePreview } from '@/modules/module-03-chat/components/PhotoSharePreview'
import { PinnedBanner } from '@/modules/module-03-chat/components/PinnedBanner'
import { ReactionBar } from '@/modules/module-03-chat/components/ReactionBar'
import { TypingIndicator } from '@/modules/module-03-chat/components/TypingIndicator'
import { VoiceNoteRecorder } from '@/modules/module-03-chat/components/VoiceNoteRecorder'
import { useBackTo } from '@/hooks/useBackTo'
import { groupPositions } from '@/modules/module-03-chat/grouping'
import { useChatStore } from '@/modules/module-03-chat/state/chatStore'
import { useRelationshipStore } from '@/state/relationshipStore'
import { callSignalingService } from '@/services/calls'
import { currentLocation, locationMapUrl } from '@/services/sharedPlaces/location'
import { Input } from '@/design-system/primitives/Input'
import { Button } from '@/design-system/primitives/Button'
import { Text } from '@/design-system/primitives/Text'

/** Chat — Conversation. Figma `Ziyu` 3390:665 / 3390:521 / 3390:585. */
export function ConversationScreen() {
  const s = useChatStore()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { theme } = useUnistyles()
  // Opened directly (a shared link, a reload on this URL) there is no stack to
  // pop, so Back falls back to the list this thread sits in.
  const onBack = useBackTo('/(app)/chat')
  const scroll = useRef<ScrollView>(null)
  const loaded = useRef(false)
  const [loadError, setLoadError] = useState(false)
  const locationRequest = useRef(0)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [locationBusy, setLocationBusy] = useState(false)
  const [locationDraft, setLocationDraft] = useState<{ uri: string; label: string } | null>(null)
  const [attachmentSending, setAttachmentSending] = useState(false)

  useEffect(() => () => { locationRequest.current += 1 }, [])
  const partnerName = useRelationshipStore((state) => state.partner?.name)
    ?? CHAT_COPY.home.defaultPartnerName
  const startCall = (mode: 'voice' | 'video') => {
    const callId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    router.push({
      pathname: mode === 'video' ? '/(app)/chat/moment/video' : '/(app)/chat/moment/voice',
      params: { callId },
    })
  }

  useEffect(() => callSignalingService.subscribe((signal) => {
    if (signal.action !== 'invite') return
    router.push({
      pathname: signal.mode === 'video' ? '/(app)/chat/moment/video' : '/(app)/chat/moment/voice',
      params: { callId: signal.callId, incoming: 'true' },
    })
  }), [router])

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    void s.load().catch(() => setLoadError(true))
  }, [s])

  /**
   * Save Memory's pass/fail report. Screen-local state, not the store's —
   * `chatStore` resolves `saveAsMemory` with a plain boolean and moves on;
   * turning that into a message the user actually sees is exactly the kind
   * of wiring a screen owns, not the store. `key` is bumped on every attempt
   * (not left at a fixed value) so pressing "Save Memory" again while a
   * banner from the last attempt is still showing remounts `FeedbackBanner`
   * with a fresh identity — its self-dismiss timer restarts and the new
   * message gets its own screen-reader announcement, instead of the second
   * result being silently absorbed by a component that already fired both.
   */
  const [feedback, setFeedback] = useState<{ key: number; tone: FeedbackTone; message: string } | null>(null)

  const cancelLocation = () => {
    locationRequest.current += 1
    setLocationBusy(false)
    setLocationDraft(null)
  }

  const stageLocation = async () => {
    s.closeAttachments()
    const request = ++locationRequest.current
    setLocationBusy(true)
    try {
      const fix = await currentLocation()
      if (request !== locationRequest.current) return
      setLocationDraft({ uri: locationMapUrl(fix), label: `${fix.latitude.toFixed(5)}, ${fix.longitude.toFixed(5)}` })
    } catch (error) {
      if (request === locationRequest.current) setFeedback({ key: Date.now(), tone: 'error', message: error instanceof Error ? error.message : 'Location could not be obtained.' })
    } finally {
      if (request === locationRequest.current) setLocationBusy(false)
    }
  }

  const sendNote = async () => {
    if (!noteDraft.trim() || noteDraft.length > 4000 || attachmentSending) return
    setAttachmentSending(true)
    await s.sendNote(noteDraft)
    setAttachmentSending(false)
    setNoteDraft('')
    setNoteOpen(false)
  }

  const sendLocation = async () => {
    if (!locationDraft || attachmentSending) return
    setAttachmentSending(true)
    await s.sendLocation(locationDraft.uri, locationDraft.label)
    setAttachmentSending(false)
    setLocationDraft(null)
  }

  const handleSaveMemory = () => {
    const id = s.selectedMessageId
    if (!id) return
    void (async () => {
      const ok = await s.saveAsMemory(id)
      setFeedback({
        key: Date.now(),
        tone: ok ? 'success' : 'error',
        message: ok ? CHAT_COPY.feedback.saveMemorySuccess : CHAT_COPY.feedback.saveMemoryError,
      })
    })()
  }

  /**
   * Copies the selected message's text.
   *
   * Uses the same `feedback` channel as Save Memory, so both rows of the
   * context menu confirm themselves identically. A copy that says nothing is
   * indistinguishable from a copy that failed.
   */
  const handleCopyMessage = () => {
    const id = s.selectedMessageId
    const body = id ? s.messages.find((m) => m.id === id)?.body : undefined

    if (!body) return

    void (async () => {
      await Clipboard.setStringAsync(body)
      s.clearSelection()
      setFeedback({ key: Date.now(), tone: 'success', message: CHAT_COPY.feedback.copied })
    })()
  }

  /*
   * Attaching a photo, for real — this replaced `stagePhoto('file://sample.jpg')`.
   *
   * Cancelling stages nothing and says nothing: the sheet simply closes, which
   * is what changing your mind should look like. A refusal is worth a sentence,
   * and it reuses the shared picker copy rather than inventing chat-specific
   * wording for the same three outcomes.
   */
  const stagePicked = (open: 'pick' | 'capture') => {
    void (async () => {
      const result =
        open === 'pick' ? await mediaService.pickPhoto() : await mediaService.takePhoto()

      s.closeAttachments()

      if (result.ok) {
        s.stagePhoto(result.value.uri)

        return
      }

      if (result.error.code === 'CANCELLED') return

      setFeedback({
        key: Date.now(),
        tone: 'error',
        message: PHOTO_PICK_COPY.errors[result.error.code],
      })
    })()
  }

  const handleAttachPhoto = () => stagePicked('pick')
  const handleCapturePhoto = () => stagePicked('capture')

  const replyBody = s.replyTarget
    ? s.messages.find((m) => m.id === s.replyTarget)?.body
    : undefined

  // The banner shows exactly one pinned message even when several are
  // pinned — the FIRST one in thread order, i.e. the oldest pin still
  // sitting in `messages`. The rest of the pins are one tap away, on the
  // screen this banner itself opens.
  const firstPinned = s.messages.find((m) => m.pinned)

  // Which messages belong to a run, worked out once for the thread rather
  // than per bubble: the answer for any one message depends on its
  // neighbours, which a bubble cannot see.
  const positions = useMemo(() => groupPositions(s.messages), [s.messages])

  return (
    <View style={styles.page}>
      <ThemedStatusBar />

      {/* The composer has to clear the keyboard, and this screen is the only
          one in the module with a field pinned to the bottom edge. `padding`
          on iOS; Android resizes the window itself (edge-to-edge is
          configured app-wide), where adding a behaviour here would double the
          adjustment and leave a gap. */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* No `AppScreenLayout` here — that chrome is the generic wordmark
            header + bottom tab bar, and this screen draws its own header
            (avatar, name, presence, calls) instead. It still needs the top
            inset for itself, since nothing above it is providing one. */}
        <View style={{ paddingTop: insets.top }}>
          <ChatHeader
            partnerName={partnerName}
            onBack={onBack}
            isPartnerTyping={s.isPartnerTyping}
            onVoiceCall={() => startCall('voice')}
            onVideoCall={() => startCall('video')}
          />
        </View>

        {/* Rendered in normal flow, not floating, so a shown/dismissed message
            nudges the thread below it rather than needing its own absolute
            layer — the simplest option for something this transient, and this
            screen already gives every OTHER overlay (scrim, attachment sheet)
            its own dedicated layer only because those genuinely must cover the
            thread; this one does not. */}
        {feedback && (
          <FeedbackBanner
            key={feedback.key}
            tone={feedback.tone}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

        {loadError ? <View style={{ padding: theme.spacing.md }}>
          <Text variant="footnote" tone="error" accessibilityRole="alert">Messages could not be loaded.</Text>
          <Button label="Reload messages" variant="outline" onPress={() => { void s.load().then(() => setLoadError(false)).catch(() => setLoadError(true)) }} />
        </View> : null}

        <View style={styles.threadLayer}>
          {/* The same flat-fill-plus-glow the form screens use (see
              `AuthScreenLayout`), so the thread shares the app's atmosphere
              instead of being its one plain white surface. A vertical fade to
              a matched hue at zero alpha, NOT a rounded solid: a solid leaves
              a visible curved edge cutting across the first message. */}
          <LinearGradient
            colors={[theme.colors.surface.glow, theme.colors.surface.glowFade]}
            style={styles.glow}
            pointerEvents="none"
          />

          <ScrollView
            ref={scroll}
            contentContainerStyle={styles.thread}
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
          >
            {/* Only ever the top-of-thread banner from Task 11's brief — rendered
                inside the `ScrollView` (not floating above it) so it scrolls
                away with the rest of the thread rather than pinning itself over
                the header, which nothing in the frame draws. */}
            {firstPinned && (
              <PinnedBanner
                message={firstPinned}
                onPress={() => router.push('/(app)/chat/search')}
              />
            )}
            {/* "Today", not the frame's "TODAY, 5:42 PM": a divider marks the
                day a run of messages belongs to, and naming one minute inside
                that day is a fact about a single message, which every bubble
                already states for itself. */}
            <DayDivider label={CHAT_COPY.conversation.dividerToday} />
            {s.messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                onLongPress={s.selectMessage}
                onRetry={s.retry}
                group={positions[i]}
                // The quoted message's own body, looked up here (not inside
                // `MessageBubble` — components never import a service, and this
                // screen already holds `messages`) so a reply bubble can render
                // what it quotes alongside what it says.
                quotedBody={
                  m.replyToId ? s.messages.find((x) => x.id === m.replyToId)?.body : undefined
                }
              />
            ))}
            {s.isPartnerTyping && <TypingIndicator />}
          </ScrollView>
        </View>

        {/* One or the other, never both: `VoiceNoteRecorder` replaces the
            composer bar entirely while recording, same as the frame draws it
            (Figma 3390:164), rather than floating over it. The placeholder uri
            is staged here, not inside the recorder — components never import a
            service, and `sendVoice` (not this screen) is what already handles
            the optimistic bubble and its failure path; this screen only turns
            "recording stopped with N ms elapsed" into that one call. */}
        {s.isRecording ? (
          <VoiceNoteRecorder
            onCancel={s.stopRecording}
            onSend={(durationMs) => { void s.sendVoice('file://voice-note.m4a', durationMs) }}
          />
        ) : (
          <Composer
            partnerName={partnerName}
            value={s.draft}
            onChangeText={s.setDraft}
            // Trimmed here, not in the store: `Composer` hands over the raw
            // field value and `send()` does not trim, so a message typed with
            // leading/trailing space would otherwise ship padded.
            onSend={(v) => { void s.send(v.trim()) }}
            onAttach={s.openAttachments}
            onRecord={s.startRecording}
            replyTo={replyBody}
            onCancelReply={s.cancelReply}
          />
        )}
      </KeyboardAvoidingView>

      {/* The long-press overlay: a full-screen scrim (dismiss-on-tap-outside)
          with the reaction bar and context menu floating above it. Rendered
          last so it draws over the composer too — the same stacking order
          the frame gives it. Outside the keyboard-avoiding view on purpose:
          a scrim covers the whole screen, keyboard or no keyboard. */}
      {s.selectedMessageId && (
        <Overlay onDismiss={s.clearSelection} dismissLabel="Dismiss message actions">
          <ReactionBar
            onReact={(emoji) => { void s.react(s.selectedMessageId!, emoji) }}
            // No design for what "more reactions" opens yet (an emoji
            // keyboard / full picker). Left unset rather than guessing at
            // one — `ReactionBar` renders its own control `disabled` when
            // `onMore` is omitted, same call `ChatHeader` makes for its
            // reserved "More options", instead of a control that looks
            // pressable and quietly does nothing.
          />
          <MessageContextMenu
            onReply={() => s.startReply(s.selectedMessageId!)}
            // Live now that `expo-clipboard` is installed. The row used to be
            // left unset on purpose so it rendered `disabled` rather than
            // looking pressable; it no longer has to be.
            onCopy={handleCopyMessage}
            onSaveMemory={handleSaveMemory}
          />
        </Overlay>
      )}

      {/* The attachment sheet's own scrim — mutually exclusive with the
          selection overlay above (`openAttachments`/`selectMessage` already
          close one another in the store), so only ever one of the two is on
          screen. `justifyContent: 'flex-end'` is what pins the sheet to the
          bottom rather than the overlay's own centred layout. */}
      {s.attachmentSheetOpen && (
        <Overlay onDismiss={s.closeAttachments} dismissLabel="Dismiss attachments" align="bottom">
          <AttachmentSheet
            // The real picker, replacing the `file://sample.jpg` placeholder
            // that stood in while `expo-image-picker` was uninstalled.
            onPickPhoto={handleAttachPhoto}
            onCamera={handleCapturePhoto}
            // The recorder and the store action behind it (`startRecording`)
            // already exist — `Composer`'s own mic button already reaches
            // for the exact same one. The sheet's tile had just never been
            // wired to it.
            onVoiceNote={() => { s.closeAttachments(); s.startRecording() }}
            // No dedicated picker screen for "attach an existing memory" —
            // the bridge the other direction (`saveAsMemory`, this screen's
            // own `handleSaveMemory`) exists, but nothing turns a memory
            // back into a message yet. Opening the Memories module itself
            // is the honest middle ground: it goes somewhere real instead
            // of just closing the sheet.
            onMemory={() => { s.closeAttachments(); router.push('/(app)/memories') }}
            onLocation={() => { void stageLocation() }}
            onNote={() => { s.closeAttachments(); setNoteOpen(true) }}
            onClose={s.closeAttachments}
          />
        </Overlay>
      )}

      {noteOpen ? (
        <Overlay onDismiss={() => { if (!attachmentSending) setNoteOpen(false) }} dismissLabel="Close note">
          <View style={styles.attachmentEditor}>
            <Text variant="h3" tone="heading">Add note</Text>
            <Input label="Note" value={noteDraft} onChangeText={setNoteDraft} maxLength={4000} multiline />
            <Text variant="footnote" tone={noteDraft.length > 4000 ? 'error' : 'placeholder'}>{`${noteDraft.length} / 4000`}</Text>
            <Button label="Send note" onPress={() => { void sendNote() }} loading={attachmentSending} disabled={!noteDraft.trim() || noteDraft.length > 4000} />
            <Button label="Cancel" variant="outline" onPress={() => setNoteOpen(false)} disabled={attachmentSending} />
          </View>
        </Overlay>
      ) : null}
      {locationBusy || locationDraft ? (
        <Overlay onDismiss={() => { if (!attachmentSending) cancelLocation() }} dismissLabel="Cancel location sharing">
          <View style={styles.attachmentEditor}>
            <Text variant="h3" tone="heading">One-time location</Text>
            <Text variant="body" tone="body">{locationBusy ? 'Getting your location...' : locationDraft?.label}</Text>
            <Button label="Send location" onPress={() => { void sendLocation() }} loading={attachmentSending} disabled={!locationDraft || locationBusy} />
            <Button label="Cancel" variant="outline" onPress={cancelLocation} disabled={attachmentSending} />
          </View>
        </Overlay>
      ) : null}

      {/* Full-screen in its own right (`PhotoSharePreview` covers the screen
          itself), so it renders as a plain sibling rather than inside a
          styled wrapper here. */}
      {s.pendingPhotoUri && (
        <PhotoSharePreview
          uri={s.pendingPhotoUri}
          onSend={(uri, caption) => { void s.sendPhoto(uri, caption) }}
          onCancel={s.clearPhoto}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  attachmentEditor: { width: '100%', maxWidth: theme.layout.column, padding: theme.spacing.lg, gap: theme.spacing.md, backgroundColor: theme.colors.surface.page, borderRadius: theme.radii.panel },
  page: { flex: 1, backgroundColor: theme.colors.surface.page },
  flex: { flex: 1 },
  threadLayer: { flex: 1 },
  glow: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    // Deep enough to fade out behind the first exchange, short enough that the
    // rest of the thread sits on the flat page fill the timestamps were
    // contrast-checked against.
    height: 220,
  },
  thread: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    // The same content column every other screen uses (`layout.column`), so a
    // thread on a large phone in landscape, or a foldable, stops stretching
    // into unreadable full-width lines and centres instead. On any phone in
    // portrait this is simply 100%.
    width: '100%',
    maxWidth: theme.layout.column,
    alignSelf: 'center',
  },
}))
