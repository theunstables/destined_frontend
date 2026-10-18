import { Text } from '@/design-system/primitives/Text'

type AuthEyebrowProps = {
  children: string
  align?: 'left' | 'center'
}

/** Narrative metadata shared by every screen in the redesigned auth journey. */
export function AuthEyebrow({ children, align = 'left' }: AuthEyebrowProps) {
  return (
    <Text variant="caption" tone="brand" align={align}>
      {children}
    </Text>
  )
}