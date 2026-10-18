import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { Card } from '@/design-system/primitives/Card'
import { CodeDisplay } from '@/design-system/primitives/CodeDisplay'
import { Text } from '@/design-system/primitives/Text'

type PairingCodeCardProps = {
  label: string
  code: string | null
  status: string
}

/** The secure invitation surface shared by issue and waiting states. */
export function PairingCodeCard({ label, code, status }: PairingCodeCardProps) {
  return (
    <Card>
      <View style={styles.content}>
        <Text variant="caption" tone="body" align="center">
          {label}
        </Text>
        {code ? <CodeDisplay code={code} /> : null}
        <Text variant="caption" tone="brand" align="center">
          {status}
        </Text>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create((theme) => ({
  content: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
}))