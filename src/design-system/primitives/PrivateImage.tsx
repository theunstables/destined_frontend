import { Image as ExpoImage, type ImageProps, type ImageSource } from 'expo-image'
import { usePrivateMediaUri } from '@/hooks/usePrivateMediaUri'
import { privateMediaPath } from '@/services/media/privateMedia'

export function Image({ source, ...props }: ImageProps) {
  const original = Array.isArray(source) ? source[0] : source
  const uri = typeof original === 'string' ? original
    : original && typeof original === 'object' ? (original as ImageSource).uri : undefined
  const resolved = usePrivateMediaUri(uri)
  const privateSource = privateMediaPath(uri) !== null
  return <ExpoImage {...props} source={privateSource ? (resolved ? { uri: resolved } : undefined) : source}
    cachePolicy={privateSource ? 'none' : props.cachePolicy} recyclingKey={privateSource ? resolved ?? 'private-loading' : props.recyclingKey} />
}