import { useEffect } from 'react'
import { AccessibilityInfo, Modal, Pressable, ScrollView, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { ALBUMS_COPY as COPY } from '@/copy/albums'
import { Overlay } from '@/design-system/patterns/Overlay'
import { Button } from '@/design-system/primitives/Button'
import { Text } from '@/design-system/primitives/Text'
import type { MemoryAlbum } from '@/services/memories/types'

type Props = {
  visible: boolean
  albums: MemoryAlbum[]
  loading?: boolean
  selectedId?: string
  error?: string | null
  onSelect: (album: MemoryAlbum) => void
  onCreate: () => void
  onCancel: () => void
}

export function AlbumPicker({
  visible,
  albums,
  loading = false,
  selectedId,
  error,
  onSelect,
  onCreate,
  onCancel,
}: Props) {
  useEffect(() => {
    if (visible) AccessibilityInfo.announceForAccessibility(COPY.picker.heading)
  }, [visible])

  if (!visible) return null

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <Overlay onDismiss={onCancel} dismissLabel={COPY.picker.cancel} align="bottom">
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text variant="h3" tone="heading">
            {COPY.picker.heading}
          </Text>

          {loading ? (
            <View accessibilityRole="progressbar" accessibilityLiveRegion="polite">
              <Text variant="body" tone="body">
                {COPY.picker.loading}
              </Text>
            </View>
          ) : albums.length === 0 ? (
            <Text variant="body" tone="body">
              {COPY.picker.empty}
            </Text>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {albums.map((album) => (
                <Pressable
                  key={album.id}
                  onPress={() => onSelect(album)}
                  disabled={selectedId !== undefined}
                  accessibilityRole="button"
                  accessibilityLabel={album.label}
                  accessibilityState={{ busy: selectedId === album.id, disabled: selectedId !== undefined }}
                  style={styles.album}
                >
                  <Text variant="h3" tone="heading">
                    {album.emoji ?? '♡'}
                  </Text>
                  <View style={styles.albumText}>
                    <Text variant="labelStrong" tone="heading">
                      {album.label}
                    </Text>
                    <Text variant="footnote" tone="muted">
                      {COPY.list.count(album.count)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {error ? (
            <View accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Text variant="footnote" tone="error">
                {error}
              </Text>
            </View>
          ) : null}

          <Button label={COPY.picker.create} onPress={onCreate} variant="outline" disabled={loading} />
          <Button label={COPY.picker.cancel} onPress={onCancel} variant="link" />
        </View>
      </Overlay>
    </Modal>
  )
}

const styles = StyleSheet.create((theme) => ({
  sheet: {
    width: '100%',
    maxWidth: theme.layout.column,
    maxHeight: '80%',
    alignSelf: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    borderTopLeftRadius: theme.radii.panel,
    borderTopRightRadius: theme.radii.panel,
    backgroundColor: theme.colors.surface.card,
    boxShadow: theme.elevation.held,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    gap: theme.spacing.sm,
  },
  album: {
    minHeight: theme.control.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.field,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.surface.field,
  },
  albumText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
}))