import type { PropsWithChildren } from 'react'
import { ScrollViewStyleReset } from 'expo-router/html'

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="referrer" content="no-referrer" />
        <title>Tales of Two</title>
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  )
}