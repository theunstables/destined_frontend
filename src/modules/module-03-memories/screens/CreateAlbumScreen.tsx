import { useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { ALBUMS_COPY as COPY } from '@/copy/albums'
import { AppScreenLayout } from '@/design-system/patterns/AppScreenLayout'
import { PhotoPicker } from '@/design-system/patterns/PhotoPicker'
import { Button } from '@/design-system/primitives/Button'
import { Input } from '@/design-system/primitives/Input'
import { Text } from '@/design-system/primitives/Text'
import { useBackTo } from '@/hooks/useBackTo'
import { usePhotoPick } from '@/hooks/usePhotoPick'
import { memoriesService } from '@/services/memories'

export function CreateAlbumScreen() {
  const router = useRouter()
  const back = useBackTo('/(app)/memories/albums')
  const submitting = useRef(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [coverUri, setCoverUri] = useState<string | undefined>()
  const [nameError, setNameError] = useState<string | undefined>()
  const [emojiError, setEmojiError] = useState<string | undefined>()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { pick, error: photoError } = usePhotoPick(setCoverUri, {
    allowsEditing: true,
    aspect: [4, 3],
  })

  const changeName = useCallback((value: string) => {
    setName(value)
    setNameError(undefined)
    setSubmitError(null)
  }, [])

  const changeEmoji = useCallback((value: string) => {
    setEmoji(value)
    setEmojiError(undefined)
    setSubmitError(null)
  }, [])

  const submit = useCallback(async () => {
    if (submitting.current) return
    const label = name.trim()
    const icon = emoji.trim()
    if (!label) {
      setNameError(COPY.create.nameRequired)
      return
    }
    if (label.length > 60) {
      setNameError(COPY.create.nameTooLong)
      return
    }
    if (icon.length > 8) {
      setEmojiError(COPY.create.emojiTooLong)
      return
    }

    submitting.current = true
    setSaving(true)
    setSubmitError(null)
    const result = await memoriesService.createAlbum({
      label,
      emoji: icon || undefined,
      coverUri,
    })
    submitting.current = false
    setSaving(false)

    if (!result.ok) {
      setSubmitError(COPY.create.errors[result.error.code])
      return
    }
    router.replace(`/(app)/memories/albums/${encodeURIComponent(result.value.id)}`)
  }, [coverUri, emoji, name, router])

  return (
    <AppScreenLayout activeTab="memories" onBack={back}>
      <View style={styles.head}>
        <Text variant="caption" tone="muted">
          {COPY.create.eyebrow.toUpperCase()}
        </Text>
        <Text variant="h2" tone="heading">
          {COPY.create.heading}
        </Text>
      </View>

      <PhotoPicker
        label={COPY.create.photoLabel}
        name={name || COPY.create.heading}
        uri={coverUri}
        onPick={pick}
      />
      {photoError ? <Text variant="footnote" tone="error">{photoError}</Text> : null}

      <Input
        label={COPY.create.nameLabel}
        value={name}
        onChangeText={changeName}
        placeholder={COPY.create.namePlaceholder}
        autoCapitalize="words"
        error={nameError}
      />
      <Input
        label={COPY.create.emojiLabel}
        value={emoji}
        onChangeText={changeEmoji}
        placeholder={COPY.create.emojiPlaceholder}
        error={emojiError}
      />

      {submitError ? (
        <View accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Text variant="footnote" tone="error">
            {submitError}
          </Text>
        </View>
      ) : null}

      <Button label={COPY.create.submit} onPress={submit} loading={saving} />
      <Button label={COPY.create.cancel} onPress={back} variant="link" disabled={saving} />
    </AppScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  head: {
    gap: theme.spacing.xs,
  },
}))