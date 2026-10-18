import { Text } from '@/design-system/primitives/Text'

type AuthFormErrorProps = {
  message: string | null | undefined
}

/**
 * Announces request-level authentication failures without moving focus or
 * discarding safe form input. Field validation remains owned by `FormField`.
 */
export function AuthFormError({ message }: AuthFormErrorProps) {
  if (!message) return null

  return (
    <Text
      variant="footnote"
      tone="error"
      align="center"
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      {message}
    </Text>
  )
}
