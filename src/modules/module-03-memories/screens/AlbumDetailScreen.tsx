import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { useBackTo } from '@/hooks/useBackTo'
import { ALBUMS_COPY as COPY } from '@/copy/albums'
import { AppScreenLayout } from '@/design-system/patterns/AppScreenLayout'
import { Button } from '@/design-system/primitives/Button'
import { Text } from '@/design-system/primitives/Text'
import { PhotoMemoryCard } from '@/modules/module-03-memories/components/PhotoMemoryCard'
import { SAMPLE_HOME } from '@/sample/home'
import { findAlbum, memoriesInAlbum } from '@/sample/albums'
import type { Album } from '@/sample/albums'
import { USE_SAMPLE_CONTENT } from '@/sample'
import { memoriesService } from '@/services/memories'
import type { Memory, MemoryAlbum } from '@/services/memories/types'
import { useRelationshipStore } from '@/state/relationshipStore'

/**
 * M03-S06 — Album Detail. Figma `Ziyu`, Memories Page frame 3 ("Trips ✈️").
 *
 * The design gives the album a cover hero with the title reversed out over it,
 * then a mixed feed: photos with a location chip, a text note, video tiles. The
 * videos are drawn but there is no video in the data model and no player
 * installed, so a video memory renders as its still — the one place this screen
 * knowingly stops short of the frame.
 */
export function AlbumDetailScreen() {
  const { theme } = useUnistyles()
  const router = useRouter()
  const back = useBackTo('/(app)/memories')
  const { key } = useLocalSearchParams<{ key: string }>()
  const profileName = useRelationshipStore((state) => state.profile?.name)
  const partnerName = useRelationshipStore((state) => state.partner?.name)
  const [album, setAlbum] = useState<Album | MemoryAlbum | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState(false)

  useEffect(() => {
    let active = true
    const id = decodeURIComponent(key ?? '')
    void Promise.all([memoriesService.getAlbum({ id }), memoriesService.listAlbumMemories({ albumId: id })])
      .then(([albumResult, memoriesResult]) => {
        if (!active) return
        if (albumResult.ok && memoriesResult.ok) {
          setAlbum(albumResult.value)
          setMemories(memoriesResult.value)
        } else if (USE_SAMPLE_CONTENT) {
          const sample = findAlbum(id)
          if (sample) {
            setAlbum(sample)
            setMemories(memoriesInAlbum(sample))
          } else {
            setError(COPY.detail.missing)
          }
        } else {
          setError(albumResult.ok ? COPY.detail.loadError : COPY.detail.missing)
        }
        setLoaded(true)
      })
    return () => { active = false }
  }, [key])

  const open = useCallback((id: string) => router.push(`/(app)/memories/${id}`), [router])

  const remove = useCallback((memoryId: string) => {
    if (!album || !('id' in album)) return
    setRemoveError(false)
    void memoriesService.removeFromAlbum({ albumId: album.id, memoryId }).then((result) => {
      if (!result.ok) {
        setRemoveError(true)
        return
      }
      setMemories((current) => current.filter((memory) => memory.id !== memoryId))
      setAlbum((current) => current && 'id' in current
        ? { ...current, count: Math.max(0, current.count - 1) }
        : current)
    })
  }, [album])

  if (!loaded) return <AppScreenLayout activeTab="memories" onBack={back} />

  if (!album) {
    return (
      <AppScreenLayout activeTab="memories" onBack={back}>
        <Text variant="body" tone="body">
          {error ?? COPY.detail.missing}
        </Text>
        <Button label={COPY.detail.back} onPress={back} variant="outline" />
      </AppScreenLayout>
    )
  }

  const count = 'count' in album ? album.count : album.sampleCount
  const heroUri = 'heroUri' in album ? album.heroUri : album.coverUri
  const coupleName = [profileName, partnerName].filter(Boolean).join(' & ') || SAMPLE_HOME.coupleName

  return (
    <AppScreenLayout activeTab="memories" onBack={back}>
      <View style={styles.hero}>
        <Image
          source={heroUri ? { uri: heroUri } : undefined}
          // Plain style object — Unistyles styles do not reach expo-image.
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 180,
            backgroundColor: theme.colors.surface.soft,
          }}
          contentFit="cover"
          contentPosition={'heroContentPosition' in album ? album.heroContentPosition ?? 'center' : 'center'}
          transition={200}
          testID={`album-hero-${album.key}`}
        />

        <View style={styles.heroText}>
          <Text variant="h2" tone="onPrimary">
            {album.label} {album.emoji}
          </Text>
          <Text variant="caption" tone="onPrimary">
            {COPY.detail.subtitle(count, coupleName)}
          </Text>
        </View>
      </View>

      {memories.length === 0 ? (
        <Text variant="body" tone="body">
          {COPY.detail.empty}
        </Text>
      ) : (
        <View style={styles.feed}>
          {memories.map((memory) => (
            <View key={memory.id} style={styles.memory}>
              <PhotoMemoryCard memory={memory} onPress={open} />
              {'id' in album ? (
                <Button
                  label={COPY.detail.remove}
                  onPress={() => remove(memory.id)}
                  variant="outline"
                />
              ) : null}
            </View>
          ))}
        </View>
      )}

      {removeError ? (
        <Text variant="footnote" tone="error" accessibilityRole="alert">
          {COPY.detail.removeError}
        </Text>
      ) : null}
    </AppScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  hero: {
    width: '100%',
    height: 180,
    borderRadius: theme.radii.field,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.surface.soft,
  },
  heroText: {
    gap: 2,
    padding: theme.spacing.lg,
    // The design reverses the title out over the photo. A scrim keeps it legible
    // whatever the cover happens to be, which a plain overlay would not.
    backgroundColor: theme.colors.surface.scrim,
  },
  feed: {
    gap: theme.spacing.lg,
  },
  memory: {
    gap: theme.spacing.sm,
  },
}))
