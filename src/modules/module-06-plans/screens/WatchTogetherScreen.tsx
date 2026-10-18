import { Feather } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { WATCH_COPY } from '@/copy/watchTogether'
import { isMockMode } from '@/config/env'
import { AppScreenLayout } from '@/design-system/patterns/AppScreenLayout'
import { Button } from '@/design-system/primitives/Button'
import { Input } from '@/design-system/primitives/Input'
import { Text } from '@/design-system/primitives/Text'
import { Chip } from '@/modules/module-06-plans/components/Chip'
import { ProgressBar } from '@/modules/module-06-plans/components/ProgressBar'
import { ScreenIntro } from '@/modules/module-06-plans/components/ScreenIntro'
import {
  SAMPLE_WATCH_KEEPSAKE,
} from '@/sample/plans'
import { memoriesService } from '@/services/memories'
import type { WatchRoom, Whisper } from '@/services/plans/types'
import { watchTogetherService } from '@/services/watchTogether'
import { usePlansStore } from '@/state/plansStore'
import { useRelationshipStore } from '@/state/relationshipStore'

const REACTIONS = ['❤️', '😂', '😮', '😊'] as const

/**
 * Fills its parent, as a PLAIN object.
 *
 * Not `StyleSheet.absoluteFill`: that is Unistyles' re-export, and Unistyles
 * styles do not survive into expo-image — the poster would draw 0×0. See
 * `expoImageStyles.test.ts`.
 */
const IMAGE_FILL = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const

/**
 * M06-S11 · Watch Together. Figma 3482:2738.
 *
 * A REAL PLAYER, not a mock surface. `expo-video` was installed for this screen,
 * so the frame's player chrome is an actual `VideoView` with native controls
 * rather than a styled rectangle — scrubbing, fullscreen and the volume slider
 * come from the platform and do not have to be drawn.
 *
 * The clip is a public test video; see `SAMPLE_WATCH_STREAM` for why, and for
 * what has to replace it.
 *
 * WHAT IS HONESTLY NOT HERE: the SYNC. The frame promises "frame locked (0.02s)"
 * between two devices, and that is a server with a clock in it, not a component.
 * The badge renders what the design draws and the session is local — anything
 * else would be a lie told in a tooltip. The seam is `WatchRoom.connected` and
 * `position`, which is where a real transport would arrive.
 *
 * NATIVE BUILD REQUIRED. `expo-video` is a native module, so this screen needs a
 * dev client (`expo run:android` / `run:ios`) — it will not run in Expo Go.
 */
export function WatchTogetherScreen() {
  const room = usePlansStore((state) => state.watchRoom)
  const setWatchRoom = usePlansStore((state) => state.setWatchRoom)
  const [title, setTitle] = useState('')
  const [streamUri, setStreamUri] = useState('')

  if (room) return <WatchRoomScreen room={room} />

  const createRoom = () => {
    const cleanTitle = title.trim()
    const cleanStream = streamUri.trim()
    if (!cleanTitle || !/^https:\/\//i.test(cleanStream)) return
    setWatchRoom({
      streamUri: cleanStream,
      tonight: {
        id: `watch-${Date.now()}`,
        title: cleanTitle,
        year: new Date().getUTCFullYear(),
        meta: 'Shared screening',
        posterUri: null,
        progress: 0,
        remaining: null,
      },
      pickedBy: 'me',
      matchScore: 0,
      quote: 'Chosen by us.',
      synopsis: 'A private room for your next shared watch.',
      connected: false,
      position: '00:00:00',
      duration: '00:00:00',
      whispers: [],
      queue: [],
      history: [],
      keepsakeMemoryId: null,
    })
  }

  return (
    <AppScreenLayout activeTab="plans">
      <ScreenIntro
        chip={WATCH_COPY.eyebrow}
        chipIcon="film"
        title={WATCH_COPY.title}
        lede="Create a private room with a rights-cleared HTTPS video source."
      />
      <Input label="Title" value={title} onChangeText={setTitle} placeholder="Tonight's title" />
      <Input
        label="Video source"
        value={streamUri}
        onChangeText={setStreamUri}
        placeholder="https://…"
        autoCapitalize="none"
      />
      <Button
        label="Create shared room"
        onPress={createRoom}
        disabled={!title.trim() || !/^https:\/\//i.test(streamUri.trim())}
      />
    </AppScreenLayout>
  )
}

function WatchRoomScreen({ room }: { room: WatchRoom }) {
  const router = useRouter()
  const { theme } = useUnistyles()

  const partner = useRelationshipStore((state) => state.partner)
  const profile = useRelationshipStore((state) => state.profile)
  const setWatchRoom = usePlansStore((state) => state.setWatchRoom)

  const partnerName = partner?.name ?? (isMockMode ? 'Sarah' : 'Partner')
  const names = `${profile?.name ?? (isMockMode ? 'Chandu' : 'You')} & ${partnerName}`

  const [started, setStarted] = useState(false)
  const [whispers, setWhispers] = useState<Whisper[]>(room.whispers)
  const [draft, setDraft] = useState('')
  const [queueTitle, setQueueTitle] = useState('')
  const [reaction, setReaction] = useState<string | null>(null)
  const [savedToMemories, setSavedToMemories] = useState(Boolean(room.keepsakeMemoryId))
  const [savingKeepsake, setSavingKeepsake] = useState(false)
  const [keepsakeError, setKeepsakeError] = useState<string | null>(null)
  const [connected, setConnected] = useState(isMockMode && room.connected)
  const applyingRemotePlayback = useRef(false)

  const player = useVideoPlayer(room.streamUri, (instance) => {
    // Not auto-played: the screen has a "Start watching now" button, and a video
    // that begins on its own would talk over whatever the user was listening to.
    instance.loop = false
    instance.muted = false
  })

  useEffect(() => watchTogetherService.subscribe((event) => {
    if (event.type === 'presence') {
      setConnected(event.connected)
      return
    }
    if (event.type === 'whisper') {
      const minutes = Math.floor(event.positionSeconds / 60)
      const seconds = Math.floor(event.positionSeconds % 60).toString().padStart(2, '0')
      const entry: Whisper = {
        id: event.id, from: 'partner', text: event.text, at: `at ${minutes}:${seconds}`,
      }
      setWhispers((current) => {
        if (current.some((item) => item.id === event.id)) return current
        const next = [...current, entry]
        const currentRoom = usePlansStore.getState().watchRoom
        if (currentRoom && !currentRoom.whispers.some((item) => item.id === event.id)) {
          setWatchRoom({ ...currentRoom, whispers: [...currentRoom.whispers, entry] })
        }
        return next
      })
      return
    }
    if (event.type === 'reaction') {
      setReaction(event.emoji)
      return
    }
    if (event.type === 'playback') {
      applyingRemotePlayback.current = true
      if (Math.abs(player.currentTime - event.positionSeconds) > 0.75) {
        player.currentTime = event.positionSeconds
      }
      if (event.action === 'play') player.play()
      if (event.action === 'pause') player.pause()
      setTimeout(() => { applyingRemotePlayback.current = false }, 250)
    }
  }), [player, setWatchRoom])

  useEffect(() => {
    const observable = player as typeof player & {
      addListener?: (name: string, listener: (event: { isPlaying?: boolean }) => void) =>
        { remove: () => void }
    }
    if (!observable.addListener) return undefined
    const subscription = observable.addListener('playingChange', ({ isPlaying }) => {
      if (!applyingRemotePlayback.current) {
        watchTogetherService.playback(isPlaying ? 'play' : 'pause', player.currentTime)
      }
    })
    return () => subscription.remove()
  }, [player])

  const onStart = () => {
    setStarted(true)
    player.play()
    watchTogetherService.playback('play', player.currentTime)
  }

  const onWhisper = () => {
    const text = draft.trim()

    if (!text) return

    const entry: Whisper = {
      id: `wh-${Date.now()}`, from: 'me', text, at: `at ${Math.floor(player.currentTime / 60)}:${Math.floor(player.currentTime % 60).toString().padStart(2, '0')}`,
    }
    setWhispers((current) => {
      const next = [...current, entry]
      const currentRoom = usePlansStore.getState().watchRoom
      if (currentRoom && !currentRoom.whispers.some((item) => item.id === entry.id)) {
        setWatchRoom({ ...currentRoom, whispers: [...currentRoom.whispers, entry] })
      }
      return next
    })
    watchTogetherService.whisper(text, player.currentTime)
    setDraft('')
  }

  const addToQueue = () => {
    const title = queueTitle.trim()
    if (!title) return
    const currentRoom = usePlansStore.getState().watchRoom
    if (!currentRoom) return
    setWatchRoom({
      ...currentRoom,
      queue: [...currentRoom.queue, {
        id: `watch-queue-${Date.now()}`, title, year: new Date().getUTCFullYear(),
        meta: 'Queued together', posterUri: null, progress: 0, remaining: null,
      }],
    })
    setQueueTitle('')
  }

  const finishSession = () => {
    player.pause()
    const currentRoom = usePlansStore.getState().watchRoom
    if (!currentRoom) return
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    setWatchRoom({
      ...currentRoom,
      tonight: { ...currentRoom.tonight, progress: 100, remaining: null },
      connected: false,
      history: [{
        id: `watch-history-${Date.now()}`,
        title: currentRoom.tonight.title,
        detail: `Watched on ${today} · Shared by us`,
        reactions: reaction
          ? `${reaction} · ${currentRoom.whispers.length} whispers`
          : `${currentRoom.whispers.length} whispers`,
      }, ...currentRoom.history],
    })
    setStarted(false)
  }

  const saveKeepsake = async () => {
    if (savedToMemories || savingKeepsake) return
    setKeepsakeError(null)
    setSavingKeepsake(true)
    try {
      const result = await memoriesService.create({
        title: room.tonight.title,
        date: new Date().toISOString().slice(0, 10),
        caption: `Watched together${connected ? ' live' : ''}.`,
        note: whispers.length > 0 ? `${whispers.length} whispers shared during the session.` : undefined,
        tags: ['Watch Together'],
        favorite: false,
      })
      if (result.ok) {
        const currentRoom = usePlansStore.getState().watchRoom
        if (currentRoom) setWatchRoom({ ...currentRoom, keepsakeMemoryId: result.value.id })
        setSavedToMemories(true)
      } else setKeepsakeError('This keepsake could not be saved. Try again.')
    } catch {
      setKeepsakeError('This keepsake could not be saved. Try again.')
    } finally {
      setSavingKeepsake(false)
    }
  }

  return (
    <AppScreenLayout activeTab="plans" onBack={() => router.back()}>
      <ScreenIntro
        chip={WATCH_COPY.eyebrow}
        chipIcon="film"
        title={WATCH_COPY.title}
        lede={WATCH_COPY.lede}
      />

      {/* TONIGHT'S PICK */}
      <View style={styles.pick}>
        <View style={styles.poster}>
          {room.tonight.posterUri ? (
            <Image
              source={{ uri: room.tonight.posterUri }}
              style={IMAGE_FILL}
              contentFit="cover"
              transition={200}
            />
          ) : null}
        </View>

        <View style={styles.pickBody}>
          <View style={styles.pickChips}>
            <Chip label={WATCH_COPY.pickedBy(partnerName)} icon="heart" tone="brand" />
            <Chip label={WATCH_COPY.match(room.matchScore)} icon="star" tone="success" />
          </View>

          <Text variant="countdown" tone="placeholder">
            {room.tonight.meta.toUpperCase()}
          </Text>

          <Text variant="h3" tone="heading">
            {room.tonight.title}
          </Text>

          <Text variant="footnote" tone="body">
            {`“${room.quote}”`}
          </Text>

          <Text variant="footnote" tone="body">
            {room.synopsis}
          </Text>
        </View>
      </View>

      {started ? null : (
        <>
          <Button label={WATCH_COPY.start} onPress={onStart} />

          <Button
            label={WATCH_COPY.invite(partnerName)}
            variant="soft"
            onPress={() => router.push('/(app)/chat')}
          />
        </>
      )}

      {/* THE SESSION */}
      {started ? (
        <>
          <View style={styles.sessionHead}>
            <View style={styles.live}>
              <View style={styles.liveDot} />

              <Text variant="caption" tone="placeholder">
                {WATCH_COPY.sessionLabel}
              </Text>
            </View>

            <Chip
              label={connected ? WATCH_COPY.connected(names) : WATCH_COPY.disconnected}
              tone={connected ? 'success' : 'neutral'}
              icon="users"
            />
          </View>

          <View style={styles.playerShell}>
            <VideoView
              player={player}
              style={styles.player}
              contentFit="contain"
              nativeControls
              accessibilityLabel={WATCH_COPY.playerLabel(room.tonight.title)}
            />

            <View style={styles.playerFoot}>
              <Text variant="countdown" tone="onPrimary">
                {WATCH_COPY.watchingTogether}
              </Text>

              <Text variant="countdown" tone="onPrimary">
                {connected ? WATCH_COPY.frameLocked('live sync') : WATCH_COPY.disconnected}
              </Text>
            </View>
          </View>

          <View style={styles.reactions}>
            <Text variant="countdown" tone="placeholder">
              {WATCH_COPY.reactTo(partnerName)}
            </Text>

            {REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  setReaction(emoji)
                  watchTogetherService.react(emoji)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: reaction === emoji }}
                accessibilityLabel={`React ${emoji}`}
                style={[styles.reaction, reaction === emoji && styles.reactionActive]}
                hitSlop={4}
              >
                <Text variant="footnote" tone="body">
                  {emoji}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* WHISPERS */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text variant="caption" tone="placeholder">
                {WATCH_COPY.whispersLabel}
              </Text>

              <Text variant="countdown" tone="brand">
                {WATCH_COPY.whispersCount(whispers.length)}
              </Text>
            </View>

            {whispers.length === 0 ? (
              <Text variant="footnote" tone="placeholder">
                {WATCH_COPY.empty.whispers}
              </Text>
            ) : (
              whispers.map((whisper) => (
                <View key={whisper.id} style={styles.whisper}>
                  <Text variant="countdown" tone="brand">
                    {whisper.from === 'me' ? profile?.name ?? 'Chandu' : partnerName}
                  </Text>

                  <Text variant="footnote" tone="body">
                    {`“${whisper.text}”`}
                  </Text>

                  <Text variant="countdown" tone="placeholder">
                    {whisper.at}
                  </Text>
                </View>
              ))
            )}

            <Input
              label={WATCH_COPY.whisper}
              value={draft}
              onChangeText={setDraft}
              placeholder={WATCH_COPY.whisperPlaceholder}
            />

            <Button
              label={WATCH_COPY.send}
              variant="soft"
              onPress={onWhisper}
              disabled={draft.trim().length === 0}
            />
          </View>

          {/* KEEPSAKE BRIDGE */}
          <View style={styles.keepsake}>
            <Text variant="caption" tone="placeholder">
              {SAMPLE_WATCH_KEEPSAKE.label}
            </Text>

            <Text variant="labelStrong" tone="heading">
              {SAMPLE_WATCH_KEEPSAKE.heading}
            </Text>

            <Text variant="footnote" tone="body">
              {SAMPLE_WATCH_KEEPSAKE.lede}
            </Text>

            <View style={styles.keepsakeRow}>
              <Feather name="film" size={14} color={theme.colors.brand.primary} />

              <View style={styles.keepsakeFill}>
                <Text variant="footnote" tone="heading">
                  {SAMPLE_WATCH_KEEPSAKE.title}
                </Text>

                <Text variant="countdown" tone="placeholder">
                  {SAMPLE_WATCH_KEEPSAKE.detail}
                </Text>
              </View>
            </View>

            <Button
              label={savedToMemories ? SAMPLE_WATCH_KEEPSAKE.footer : SAMPLE_WATCH_KEEPSAKE.action}
              onPress={saveKeepsake}
              disabled={savedToMemories}
              loading={savingKeepsake}
            />
            {keepsakeError ? <Text variant="footnote" tone="danger">{keepsakeError}</Text> : null}
            <Button label="Finish session" onPress={finishSession} variant="outline" />
          </View>
        </>
      ) : null}

      {/* CONTINUE WATCHING */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text variant="caption" tone="placeholder">
            {WATCH_COPY.continueLabel}
          </Text>

          <Text variant="countdown" tone="brand">
            {WATCH_COPY.viewQueue(room.queue.length)}
          </Text>
        </View>

        <View style={styles.queue}>
          {room.queue.map((title) => (
            <View key={title.id} style={styles.queueCell}>
              <View style={styles.queueCard}>
                <View style={styles.queuePoster}>
                  {title.posterUri ? (
                    <Image
                      source={{ uri: title.posterUri }}
                      style={IMAGE_FILL}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : null}
                </View>

                <Text variant="countdown" tone="brand">
                  {WATCH_COPY.finished(title.progress).toUpperCase()}
                </Text>

                <Text variant="labelStrong" tone="heading">
                  {title.title}
                </Text>

                <ProgressBar value={title.progress / 100} footnote={title.remaining ?? undefined} />
              </View>
            </View>
          ))}
        </View>
        <Input
          label="Add to queue"
          value={queueTitle}
          onChangeText={setQueueTitle}
          placeholder="A title for later"
        />
        <Button label="Add title" onPress={addToQueue} variant="soft" disabled={!queueTitle.trim()} />
      </View>

      {/* HISTORY */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text variant="caption" tone="placeholder">
            {WATCH_COPY.historyLabel}
          </Text>

          {/*
           * Derived, not the frame's literal 14. That number sat above a list
           * of three and would have kept claiming 14 whatever the history held.
           */}
          <Text variant="countdown" tone="brand">
            {WATCH_COPY.titlesWatched(room.history.length)}
          </Text>
        </View>

        {room.history.map((entry) => (
          <View key={entry.id} style={styles.historyRow}>
            <View style={styles.historyIcon}>
              <Feather name="check" size={14} color={theme.colors.feedback.success} />
            </View>

            <View style={styles.historyFill}>
              <View style={styles.historyTop}>
                <View style={styles.historyTitleFill}>
                  <Text variant="labelStrong" tone="heading">
                    {entry.title}
                  </Text>
                </View>

                <Chip label={WATCH_COPY.completed} tone="success" />
              </View>

              <Text variant="countdown" tone="placeholder">
                {entry.detail}
              </Text>

              <Text variant="countdown" tone="body">
                {entry.reactions}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </AppScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  pick: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.panel,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.surface.card,
  },
  poster: {
    width: 96,
    height: 136,
    borderRadius: theme.radii.field,
    backgroundColor: theme.colors.surface.soft,
    overflow: 'hidden',
  },
  pickBody: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  pickChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  sessionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.feedback.success,
  },
  /*
   * The shell is near-black in BOTH themes and does not use a surface token.
   * A player is a window onto someone else's picture, and a lavender letterbox
   * around a film tints it. This is the one place in the app where the ground is
   * deliberately not the theme's.
   */
  playerShell: {
    borderRadius: theme.radii.tile,
    backgroundColor: '#0B0A12',
    overflow: 'hidden',
  },
  player: {
    width: '100%',
    height: 220,
  },
  playerFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  reactions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  reaction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.surface.card,
  },
  reactionActive: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: theme.colors.surface.field,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  whisper: {
    gap: 2,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.tile,
    backgroundColor: theme.colors.surface.field,
  },
  keepsake: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.tile,
    backgroundColor: theme.colors.accents[2].soft,
  },
  keepsakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.field,
    backgroundColor: theme.colors.surface.card,
  },
  keepsakeFill: {
    flex: 1,
    gap: 2,
  },
  queue: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  queueCell: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 0,
  },
  queueCard: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.tile,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.surface.card,
  },
  queuePoster: {
    height: 90,
    borderRadius: theme.radii.field,
    backgroundColor: theme.colors.surface.soft,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.tile,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.surface.card,
  },
  historyIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.accents[1].soft,
  },
  historyFill: {
    flex: 1,
    gap: 2,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  historyTitleFill: {
    flex: 1,
  },
}))
