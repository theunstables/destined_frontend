import { isMockMode } from '@/config/env'
import { SAMPLE_HOME } from '@/sample/home'
import { get } from '@/services/http/client'

export type AdaptiveSuggestion = {
  key: string
  text: string
  action: 'memory' | 'calendar' | 'chat'
}

type SuggestionsResponse = { generatedFor: string; items: AdaptiveSuggestion[] }

export const adaptiveContentService = {
  async suggestions(): Promise<AdaptiveSuggestion[]> {
    if (!isMockMode) return (await get<SuggestionsResponse>('/content/suggestions')).items
    return SAMPLE_HOME.littleThings.map((item) => ({ ...item, action: 'calendar' as const }))
  },
}
