import { Feather } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { MEMORIES_COPY as COPY } from '@/copy/memories'
import { Button } from '@/design-system/primitives/Button'
import { Card } from '@/design-system/primitives/Card'
import { Input } from '@/design-system/primitives/Input'
import { Text } from '@/design-system/primitives/Text'
import type { Memory } from '@/services/memories/types'
import { useMemoriesStore } from '@/state/memoriesStore'

type Props = {
  memory: Memory
  onChange: (memory: Memory) => void
}

/** M10 — reciprocal notes stay private until both partners have written one. */
export function MemoryPrivateNotesCard({ memory, onChange }: Props) {
  const { theme } = useUnistyles()
  const updatePrivateNote = useMemoriesStore((state) => state.updatePrivateNote)
  const withdrawPrivateNote = useMemoriesStore((state) => state.withdrawPrivateNote)
  const [note, setNote] = useState(memory.myPrivateNote ?? '')
  const [editing, setEditing] = useState(!memory.myPrivateNote)
  const [submitting, setSubmitting] = useState(false)
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const actionInFlight = useRef(false)

  useEffect(() => {
    setNote(memory.myPrivateNote ?? '')
    if (!memory.myPrivateNote) setEditing(true)
  }, [memory.myPrivateNote])

  const save = useCallback(async () => {
    if (actionInFlight.current) return

    const clean = note.trim()
    if (!clean) {
      setError(COPY.detail.privateNotes.required)
      return
    }

    actionInFlight.current = true
    setSubmitting(true)
    setError(null)
    const updated = await updatePrivateNote(memory.id, clean)
    actionInFlight.current = false
    setSubmitting(false)

    if (!updated) {
      setError(COPY.detail.privateNotes.error)
      return
    }

    onChange(updated)
    setEditing(false)
  }, [memory.id, note, onChange, updatePrivateNote])

  const withdraw = useCallback(async () => {
    if (actionInFlight.current) return

    actionInFlight.current = true
    setSubmitting(true)
    setError(null)
    const updated = await withdrawPrivateNote(memory.id)
    actionInFlight.current = false
    setSubmitting(false)
    setConfirmingWithdraw(false)

    if (!updated) {
      setError(COPY.detail.privateNotes.withdrawError)
      return
    }

    onChange(updated)
    setNote('')
    setEditing(true)
  }, [memory.id, onChange, withdrawPrivateNote])

  const requestWithdraw = useCallback(() => {
    if (memory.reciprocalNotesRevealed) setConfirmingWithdraw(true)
    else void withdraw()
  }, [memory.reciprocalNotesRevealed, withdraw])

  const revealed = Boolean(
    memory.reciprocalNotesRevealed && memory.myPrivateNote && memory.partnerPrivateNote,
  )

  return (
    <>
      <Card>
        <View style={styles.eyebrowRow}>
          <Feather name="lock" size={16} color={theme.colors.brand.primary} />
          <Text variant="caption" tone="brand">
            {COPY.detail.privateNotes.eyebrow}
          </Text>
        </View>

        <Text variant="h3" tone="heading">
          {COPY.detail.privateNotes.heading}
        </Text>
        <Text variant="footnote" tone="body">
          {COPY.detail.privateNotes.lede}
        </Text>

        {editing ? (
          <View style={styles.form}>
            <Input
              label={COPY.detail.privateNotes.inputLabel}
              value={note}
              onChangeText={(next) => {
                setNote(next)
                setError(null)
              }}
              placeholder={COPY.detail.privateNotes.placeholder}
              multiline
              error={error ?? undefined}
            />
            <Button
              label={memory.myPrivateNote ? COPY.detail.privateNotes.update : COPY.detail.privateNotes.save}
              onPress={save}
              loading={submitting}
              disabled={submitting}
            />
            {memory.myPrivateNote ? (
              <Button
                label={COPY.detail.privateNotes.withdraw}
                onPress={requestWithdraw}
                variant="link"
                disabled={submitting}
              />
            ) : null}
          </View>
        ) : revealed ? (
          <View style={styles.notes} accessibilityLiveRegion="polite">
            <Text variant="labelStrong" tone="success">
              {COPY.detail.privateNotes.revealedTitle}
            </Text>
            <PrivateNote label={COPY.detail.privateNotes.myNote} value={memory.myPrivateNote!} />
            <PrivateNote label={COPY.detail.privateNotes.partnerNote} value={memory.partnerPrivateNote!} />
            <View style={styles.actions}>
              <Button
                label={COPY.detail.privateNotes.edit}
                onPress={() => setEditing(true)}
                variant="outline"
              />
              <Button
                label={COPY.detail.privateNotes.withdraw}
                onPress={requestWithdraw}
                variant="link"
              />
            </View>
          </View>
        ) : (
          <View style={styles.waiting} accessibilityLiveRegion="polite">
            <Feather name="check-circle" size={18} color={theme.colors.feedback.success} />
            <View style={styles.waitingCopy}>
              <Text variant="labelStrong" tone="success">
                {COPY.detail.privateNotes.waitingTitle}
              </Text>
              <Text variant="footnote" tone="body">
                {COPY.detail.privateNotes.waitingBody}
              </Text>
            </View>
            <PrivateNote label={COPY.detail.privateNotes.myNote} value={memory.myPrivateNote!} />
            <View style={styles.actions}>
              <Button
                label={COPY.detail.privateNotes.edit}
                onPress={() => setEditing(true)}
                variant="outline"
              />
              <Button
                label={COPY.detail.privateNotes.withdraw}
                onPress={requestWithdraw}
                variant="link"
              />
            </View>
          </View>
        )}

        {!editing && error ? (
          <Text variant="footnote" tone="error" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </Card>

      <ConfirmDialog
        visible={confirmingWithdraw}
        title={COPY.detail.privateNotes.withdrawConfirm.title}
        body={COPY.detail.privateNotes.withdrawConfirm.body}
        confirmLabel={COPY.detail.privateNotes.withdrawConfirm.confirm}
        cancelLabel={COPY.detail.privateNotes.withdrawConfirm.cancel}
        onConfirm={withdraw}
        onCancel={() => setConfirmingWithdraw(false)}
        destructive
      />
    </>
  )
}

function PrivateNote({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.note}>
      <Text variant="caption" tone="brand">
        {label}
      </Text>
      <Text variant="footnote" tone="body">
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  form: {
    gap: theme.spacing.md,
  },
  waiting: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.field,
    backgroundColor: theme.colors.surface.soft,
  },
  waitingCopy: {
    gap: theme.spacing.xs,
  },
  notes: {
    gap: theme.spacing.sm,
  },
  note: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radii.field,
    backgroundColor: theme.colors.surface.soft,
  },
  actions: {
    gap: theme.spacing.sm,
  },
}))