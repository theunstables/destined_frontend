import { Feather } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { DAILY_QUESTION_COPY as COPY } from '@/copy/dailyQuestion'
import { Button } from '@/design-system/primitives/Button'
import { Card } from '@/design-system/primitives/Card'
import { Input } from '@/design-system/primitives/Input'
import { Text } from '@/design-system/primitives/Text'
import { dailyQuestionService } from '@/services/dailyQuestions'
import { useDailyQuestionStore } from '@/state/dailyQuestionStore'

/** DQ01 on Home: answer privately, wait honestly, then reveal both answers. */
export function DailyQuestionCard() {
  const { theme } = useUnistyles()
  const question = useDailyQuestionStore((state) => state.question)
  const hydrated = useDailyQuestionStore((state) => state.hydrated)
  const hydrate = useDailyQuestionStore((state) => state.hydrate)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submissionInFlight = useRef(false)

  useEffect(() => {
    if (hydrated) return
    let active = true

    void dailyQuestionService.getToday().then((result) => {
      if (!active) return
      if (result.ok) hydrate(result.value)
      else setError(COPY.errors[result.error.code])
    })

    return () => {
      active = false
    }
  }, [hydrate, hydrated])

  const submit = useCallback(async () => {
    if (submissionInFlight.current) return

    const clean = answer.trim()
    if (!clean) {
      setError(COPY.errors.required)
      return
    }

    submissionInFlight.current = true
    setSubmitting(true)
    setError(null)
    const result = await dailyQuestionService.answer(clean)
    submissionInFlight.current = false
    setSubmitting(false)

    if (!result.ok) {
      setError(COPY.errors[result.error.code])
      return
    }

    hydrate(result.value)
    setAnswer('')
  }, [answer, hydrate])

  if (!hydrated || !question) return null

  return (
    <Card>
      <View style={styles.labelRow}>
        <View style={styles.pulse} />
        <Text variant="caption" tone="brand">
          {COPY.eyebrow}
        </Text>
        <View style={styles.spacer} />
        <Text variant="display" tone="brand" accessibilityElementsHidden>
          ?
        </Text>
      </View>

      <Text variant="h3" tone="heading">
        {question.prompt}
      </Text>

      {question.status === 'complete' ? (
        <View style={styles.answers} accessibilityLiveRegion="polite">
          <Answer label={COPY.myAnswer} value={question.myAnswer ?? ''} />
          <Answer label={COPY.partnerAnswer} value={question.partnerAnswer ?? ''} />
        </View>
      ) : question.status === 'waiting' ? (
        <View style={styles.waiting} accessibilityLiveRegion="polite">
          <Feather name="lock" size={18} color={theme.colors.feedback.success} />
          <View style={styles.waitingCopy}>
            <Text variant="labelStrong" tone="success">
              {COPY.waitingTitle}
            </Text>
            <Text variant="footnote" tone="body">
              {COPY.waitingBody}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.form}>
          {question.partnerHasAnswered ? (
            <Text variant="footnote" tone="brand">
              {COPY.partnerWaiting}
            </Text>
          ) : null}
          <Input
            label={COPY.eyebrow}
            value={answer}
            onChangeText={(next) => {
              setAnswer(next)
              setError(null)
            }}
            placeholder={COPY.placeholder}
            multiline
            error={error ?? undefined}
          />
          <Button
            label={COPY.submit}
            onPress={submit}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      )}
    </Card>
  )
}

function Answer({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.answer}>
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
  labelRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.accents[0].ink,
  },
  spacer: {
    flex: 1,
  },
  form: {
    gap: theme.spacing.md,
  },
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.field,
    backgroundColor: theme.colors.surface.soft,
  },
  waitingCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  answers: {
    gap: theme.spacing.sm,
  },
  answer: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radii.field,
    backgroundColor: theme.colors.surface.soft,
  },
}))
