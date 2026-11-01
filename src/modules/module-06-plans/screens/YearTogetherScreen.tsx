import { Feather } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { YEAR_COPY } from '@/copy/yearTogether'
import { AppScreenLayout } from '@/design-system/patterns/AppScreenLayout'
import { ScrollReveal } from '@/design-system/patterns/ScrollReveal'
import { Text } from '@/design-system/primitives/Text'
import { Input } from '@/design-system/primitives/Input'
import { Button } from '@/design-system/primitives/Button'
import { useBackTo } from '@/hooks/useBackTo'
import { Chip } from '@/modules/module-06-plans/components/Chip'
import { ProgressBar } from '@/modules/module-06-plans/components/ProgressBar'
import { ScreenIntro } from '@/modules/module-06-plans/components/ScreenIntro'
import type { BingoTile, BingoTileState } from '@/services/plans/types'
import { selectTilesInProgress, selectTilesStamped, usePlansStore } from '@/state/plansStore'

type Filter = 'all' | 'done' | 'in-progress'

/**
 * M06-S04 · Our Year Together. Figma 3482:1345.
 *
 * A 25-tile bingo board the couple stamps through the year.
 *
 * TILES CYCLE THROUGH THREE STATES rather than toggling between two. The board
 * draws an amber "in progress" card and spends real design attention on it, so a
 * checkbox would have left a third of the design unreachable. The cycle is in
 * the store (`NEXT_TILE_STATE`); the hint it announces is in copy.
 *
 * The grid is two columns, not the frame's three. At 390pt a third column leaves
 * each tile about 108pt wide, and the tiles carry a title AND a note — "Cook a
 * meal neither made" / "Truffle gnocchi" — which at that width wraps to five
 * lines. Two columns keeps the content the frame put in the tile.
 */
export function YearTogetherScreen() {
  const onBack = useBackTo('/(app)/plans')
  const { theme } = useUnistyles()

  const board = usePlansStore((state) => state.yearBoard)
  const cycleTile = usePlansStore((state) => state.cycleTile)
  const stamped = usePlansStore(selectTilesStamped)
  const inProgress = usePlansStore(selectTilesInProgress)
  const saveTile = usePlansStore((state) => state.saveTile)
  const removeTile = usePlansStore((state) => state.removeTile)
  const saving = usePlansStore((state) => state.saving)
  const saveError = usePlansStore((state) => state.error)
  const hydrate = usePlansStore((state) => state.hydrate)
  const [editor, setEditor] = useState<{ id?: string; title: string; note: string } | null>(null)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [today] = useState(() => Date.now())

  const save = async () => {
    if (!editor || saving) return
    setEditorError(null)
    if (await saveTile(editor)) setEditor(null)
    else setEditorError(usePlansStore.getState().error ?? 'A card needs a title up to 140 characters and a note up to 1,000 characters. Up to 25 cards can be saved.')
  }

  const [filter, setFilter] = useState<Filter>('all')

  const total = board.tiles.length
  const percent = total === 0 ? 0 : Math.round((stamped / total) * 100)

  const visible = useMemo(() => {
    if (filter === 'done') return board.tiles.filter((tile) => tile.state === 'done')
    if (filter === 'in-progress') return board.tiles.filter((tile) => tile.state === 'in-progress')

    return board.tiles
  }, [board.tiles, filter])

  return (
    <AppScreenLayout activeTab="plans" onBack={onBack}>
      <ScreenIntro
        chip={YEAR_COPY.eyebrow}
        chipIcon="grid"
        title={YEAR_COPY.title}
        lede={YEAR_COPY.lede}
        aside={String(board.year)}
      />

      {saveError ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="footnote" tone="error" accessibilityRole="alert">{saveError}</Text>
          <Button label="Reload saved plans" variant="outline" onPress={() => { void hydrate() }} />
        </View>
      ) : null}
      {saving ? <Text variant="footnote" tone="placeholder" accessibilityLiveRegion="polite">Saving...</Text> : null}
      {editor ? (
        <View style={{ gap: theme.spacing.md }}>
          <Input label="Card title" value={editor.title} onChangeText={(title) => setEditor({ ...editor, title })} maxLength={140} onSubmitEditing={() => { void save() }} returnKeyType="done" />
          <Input label="Card note" value={editor.note} onChangeText={(note) => setEditor({ ...editor, note })} maxLength={1000} multiline />
          {editorError ? <Text variant="footnote" tone="error" accessibilityRole="alert">{editorError}</Text> : null}
          <Button label={editor.id ? 'Save card' : 'Add card'} onPress={() => { void save() }} loading={saving} />
          <Button label="Cancel" variant="outline" onPress={() => { setEditor(null); setEditorError(null) }} disabled={saving} />
        </View>
      ) : null}

      <View style={styles.panel}>
        <ProgressBar
          value={total === 0 ? 0 : stamped / total}
          label={YEAR_COPY.progress(stamped, total)}
          trailing={YEAR_COPY.completed(percent)}
          footnote={YEAR_COPY.toGo(total - stamped)}
        />

        <View style={styles.panelFoot}>
          <Text variant="footnote" tone="body">
            {`“${board.encouragement}”`}
          </Text>

          <View style={styles.daysLeft}>
            <Text variant="countdown" tone="placeholder">
              {YEAR_COPY.daysLeft.toUpperCase()}
            </Text>

            <Text variant="labelStrong" tone="brand">
              {Math.max(0, Math.ceil((Date.UTC(board.year + 1, 0, 1) - today) / 86_400_000))}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filters}>
        <Chip
          label={YEAR_COPY.filters.all}
          count={total}
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
        />

        <Chip
          label={YEAR_COPY.filters.completed}
          count={stamped}
          selected={filter === 'done'}
          onPress={() => setFilter('done')}
        />

        <Chip
          label={YEAR_COPY.filters.inProgress}
          count={inProgress}
          selected={filter === 'in-progress'}
          onPress={() => setFilter('in-progress')}
        />

        {total < 25 && !editor && !saving ? <Chip label={YEAR_COPY.addTile} icon="plus" tone="brand" onPress={() => { setEditor({ title: '', note: '' }); setEditorError(null) }} /> : null}
      </View>

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="footnote" tone="placeholder" align="center">
            {YEAR_COPY.empty[filter === 'done' ? 'completed' : filter]}
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {visible.map((tile, index) => (
            <ScrollReveal key={tile.id} effect="flip" delay={(index % 2) * 50} style={styles.tileGroup}>
              <TileCard tile={tile} onPress={() => cycleTile(tile.id)} />
              <View style={styles.cardActions}>
                <Pressable disabled={saving} onPress={() => { setEditor({ id: tile.id, title: tile.title, note: tile.note ?? '' }); setEditorError(null) }} accessibilityRole="button" accessibilityLabel={`Edit ${tile.title}`} style={styles.iconButton}>
                  <Feather name="edit-2" size={18} color={theme.colors.brand.primary} />
                </Pressable>
                <Pressable disabled={saving} onPress={() => removeTile(tile.id)} accessibilityRole="button" accessibilityLabel={`Remove ${tile.title}`} style={styles.iconButton}>
                  <Feather name="trash-2" size={18} color={theme.colors.feedback.error} />
                </Pressable>
              </View>
            </ScrollReveal>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Feather name="heart" size={14} color={theme.colors.brand.primary} />

        <Text variant="footnote" tone="placeholder" align="center">
          {YEAR_COPY.headerTitle}
        </Text>
      </View>
    </AppScreenLayout>
  )
}

function TileCard({ tile, onPress }: { tile: BingoTile; onPress: () => void }) {
  const { theme } = useUnistyles()

  styles.useVariants({ state: tile.state })

  const mark: Record<BingoTileState, keyof typeof Feather.glyphMap> = {
    todo: 'circle',
    'in-progress': 'clock',
    done: 'check-circle',
  }

  const markColor =
    tile.state === 'done'
      ? theme.colors.feedback.success
      : tile.state === 'in-progress'
        ? theme.colors.accents[0].ink
        : theme.colors.text.muted

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tile.title}. ${YEAR_COPY.cycleHint[tile.state]}`}
      style={styles.tile}
    >
      <View style={styles.tileTop}>
        <Feather name={mark[tile.state]} size={16} color={markColor} />

        <Text variant="countdown" tone="placeholder">
          {String(tile.number).padStart(2, '0')}
        </Text>
      </View>

      <Text variant="footnote" tone={tile.state === 'todo' ? 'body' : 'heading'}>
        {tile.title}
      </Text>

      {tile.note ? (
        <Text variant="countdown" tone="placeholder">
          {tile.note}
        </Text>
      ) : null}

      {tile.state === 'todo' ? null : (
        <Text variant="countdown" tone={tile.state === 'done' ? 'success' : 'brand'}>
          {YEAR_COPY.badge[tile.state]}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  panel: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.tile,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.surface.card,
  },
  panelFoot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  daysLeft: {
    alignItems: 'flex-end',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  tile: {
    minWidth: 0,
    minHeight: 120,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.tile,
    borderWidth: 1,

    variants: {
      state: {
        todo: {
          borderColor: theme.colors.border.subtle,
          backgroundColor: theme.colors.surface.card,
        },
        // The amber card. `accents[0]` is the audited peach pair — the frame's
        // own orange is not a token and has no contrast test behind it.
        'in-progress': {
          borderColor: theme.colors.accents[0].ink,
          backgroundColor: theme.colors.accents[0].soft,
        },
        done: {
          borderColor: theme.colors.border.subtle,
          backgroundColor: theme.colors.surface.field,
        },
      },
    },
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileGroup: { flexGrow: 1, flexBasis: '47%', minWidth: 0 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: {
    padding: theme.spacing.xxl,
    borderRadius: theme.radii.tile,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.field,
  },
  footer: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.lg,
  },
}))
