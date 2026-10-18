import { Feather } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { AppScreenLayout } from '@/design-system/patterns/AppScreenLayout'
import { Button } from '@/design-system/primitives/Button'
import { Text } from '@/design-system/primitives/Text'
import { Chip } from '@/modules/module-06-plans/components/Chip'
import type { CapsuleItemKind } from '@/services/plans/types'
import { usePlansStore } from '@/state/plansStore'

const labels: Record<CapsuleItemKind, string> = {
  photos: 'Photos',
  letter: 'Letters',
  memory: 'Memories',
  prediction: 'Predictions',
  promise: 'Promises',
  question: 'Questions',
}

const longDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric',
})

export function CapsuleDetailScreen() {
  const router = useRouter()
  const { theme } = useUnistyles()
  const { id } = useLocalSearchParams<{ id: string }>()
  const capsule = usePlansStore((state) => state.capsules.find((item) => item.id === id))
  const openCapsule = usePlansStore((state) => state.openCapsule)
  const [message, setMessage] = useState<string | null>(null)

  if (!capsule) {
    return (
      <AppScreenLayout activeTab="plans" onBack={() => router.back()}>
        <Text variant="h2" tone="heading">Capsule not found</Text>
        <Button label="Back to capsules" onPress={() => router.replace('/(app)/plans/capsules')} />
      </AppScreenLayout>
    )
  }

  const due = capsule.opensAt <= new Date().toISOString().slice(0, 10)
  const open = () => {
    const result = openCapsule(capsule.id)
    setMessage(result === 'not-due' ? `This capsule stays sealed until ${longDate(capsule.opensAt)}.` : null)
  }

  return (
    <AppScreenLayout activeTab="plans" onBack={() => router.back()}>
      <View style={styles.hero}>
        <View style={styles.seal}>
          <Feather
            name={capsule.opened ? 'unlock' : 'lock'}
            size={22}
            color={theme.colors.text.onPrimary}
          />
        </View>
        <Chip label={capsule.opened ? 'OPENED' : 'SEALED'} tone="brand" />
        <Text variant="h2" tone="heading" align="center">{capsule.title}</Text>
        <Text variant="body" tone="body" align="center">
          {capsule.opened
            ? `Opened for you both · ${capsule.vaultCode}`
            : `Sealed until ${longDate(capsule.opensAt)} · ${capsule.vaultCode}`}
        </Text>
        {capsule.sealNote ? <Text variant="footnote" tone="body" align="center">{`“${capsule.sealNote}”`}</Text> : null}
      </View>

      <View style={styles.contents}>
        <Text variant="caption" tone="placeholder">
          {capsule.opened ? 'CAPSULE CONTENTS' : 'SEALED INSIDE'}
        </Text>
        {(Object.entries(capsule.contents) as [CapsuleItemKind, number][]).map(([kind, count]) => (
          <View key={kind} style={styles.row}>
            <Text variant="labelStrong" tone="heading">{labels[kind]}</Text>
            <Text variant="labelStrong" tone="brand">{count}</Text>
          </View>
        ))}
      </View>

      {!capsule.opened ? (
        <Button label={due ? 'Open capsule' : `Opens ${longDate(capsule.opensAt)}`} onPress={open} />
      ) : null}
      {message ? <Text variant="footnote" tone="error" align="center">{message}</Text> : null}
    </AppScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  hero: {
    alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.xl,
    borderRadius: theme.radii.panel, backgroundColor: theme.colors.surface.card,
  },
  seal: {
    width: 58, height: 58, alignItems: 'center', justifyContent: 'center',
    borderRadius: theme.radii.pill, backgroundColor: theme.colors.brand.primary,
  },
  contents: {
    gap: theme.spacing.sm, padding: theme.spacing.lg,
    borderRadius: theme.radii.panel, backgroundColor: theme.colors.surface.card,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
}))
