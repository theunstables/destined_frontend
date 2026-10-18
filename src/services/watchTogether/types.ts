export type WatchPlaybackAction = 'play' | 'pause' | 'seek'

export type WatchRealtimeEvent =
  | { type: 'presence'; connected: boolean }
  | { type: 'playback'; action: WatchPlaybackAction; positionSeconds: number; sentAt: number }
  | { type: 'whisper'; id: string; text: string; positionSeconds: number }
  | { type: 'reaction'; emoji: string }

export type WatchTogetherService = {
  subscribe: (listener: (event: WatchRealtimeEvent) => void) => () => void
  playback: (action: WatchPlaybackAction, positionSeconds: number) => void
  whisper: (text: string, positionSeconds: number) => void
  react: (emoji: string) => void
}
