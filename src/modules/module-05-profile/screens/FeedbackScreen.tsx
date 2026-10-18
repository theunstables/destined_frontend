import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { SETTINGS_FEEDBACK_COPY as COPY } from '@/copy/settingsFeedback'
import { SectionPanel } from '@/design-system/patterns/SectionPanel'
import { SettingsChoiceRow } from '@/design-system/patterns/SettingsChoiceRow'
import { SettingsRow } from '@/design-system/patterns/SettingsRow'
import { SettingsScreenLayout } from '@/design-system/patterns/SettingsScreenLayout'
import { Button } from '@/design-system/primitives/Button'
import { Input } from '@/design-system/primitives/Input'
import { Text } from '@/design-system/primitives/Text'
import { feedbackService, type FeedbackTopic } from '@/services/feedback'

type Topic = FeedbackTopic

const TOPIC_SEGMENTS: { value: Topic; label: string }[] = [
  { value: 'problem', label: COPY.problem },
  { value: 'idea', label: COPY.idea },
  { value: 'other', label: COPY.other },
]

const schema = z.object({
  message: z
    .string()
    .trim()
    .min(1, COPY.messageRequired)
    .min(12, COPY.messageTooShort),
})

type FormValues = z.infer<typeof schema>

/**
 * M05-S19 — Settings → Contact & Feedback.
 *
 * The form validates properly and then tells the truth: there is no server, so
 * nothing was sent. Every other honest-limit note in this cluster costs the
 * user nothing to discover late; this one would cost them a reply they sat and
 * waited for.
 *
 * THE SCREENSHOT ROW AND RATE THE APP CARRY NO `onPress`, which is this
 * cluster's way of drawing something that genuinely cannot be done yet —
 * `SettingsRow` then renders no chevron and is not a button. Attaching an image
 * needs `expo-image-picker`, which is not installed; rating needs a store
 * listing, and this app has never been submitted to one. Both say which, in the
 * row, rather than being quietly absent — a person who came here to send a
 * screenshot deserves to learn that in the place they looked for it.
 */
export function FeedbackScreen() {
  const router = useRouter()
  const [topic, setTopic] = useState<Topic>('problem')

  const [submission, setSubmission] = useState<'idle' | 'sent' | 'error'>('idle')
  const { control, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  })

  const goBack = useCallback(() => router.back(), [router])
  const submit = handleSubmit(async ({ message }) => {
    setSubmission('idle')
    try {
      await feedbackService.submit({ topic, message: message.trim() })
      reset()
      setSubmission('sent')
    } catch {
      setSubmission('error')
    }
  })

  return (
    <SettingsScreenLayout title={COPY.title} lede={COPY.lede} onBack={goBack}>
      <SectionPanel title={COPY.topicLabel}>
        <SettingsChoiceRow
          label={COPY.topicLabel}
          segments={TOPIC_SEGMENTS}
          value={topic}
          onChange={setTopic}
        />
      </SectionPanel>

      <SectionPanel title={COPY.messageLabel}>
        <Controller
          control={control}
          name="message"
          render={({ field, fieldState }) => (
            <Input
              label={COPY.messageLabel}
              placeholder={COPY.messagePlaceholder}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              multiline
            />
          )}
        />
      </SectionPanel>

      <SectionPanel title={COPY.attachGroup}>
        <SettingsRow icon="image" label={COPY.attachLabel} detail={COPY.attachDetail} />
      </SectionPanel>

      <Button label={COPY.send} onPress={submit} loading={formState.isSubmitting} />

      {submission === 'sent' ? (
        <Text variant="footnote" tone="success">Feedback received. Thank you.</Text>
      ) : submission === 'error' ? (
        <Text variant="footnote" tone="error">Feedback could not be sent. Try again.</Text>
      ) : null}

      <SectionPanel title={COPY.rateGroup}>
        <SettingsRow icon="star" label={COPY.rate} detail={COPY.rateDetail} />
      </SectionPanel>
    </SettingsScreenLayout>
  )
}
