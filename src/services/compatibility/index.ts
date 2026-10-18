import { isMockMode } from '@/config/env'
import { SAMPLE_HOME } from '@/sample/home'
import { get } from '@/services/http/client'

export type CompatibilityPerson = { id: string; name: string; birthday: string | null }
export type Compatibility = { people: CompatibilityPerson[]; daysTogether: number | null }

export const compatibilityService = {
  async get(): Promise<Compatibility> {
    if (!isMockMode) return get<Compatibility>('/compatibility')
    const { you, partner } = SAMPLE_HOME.compatibility
    return {
      people: [
        { id: 'me', name: you.name, birthday: you.birthday },
        { id: 'partner', name: partner.name, birthday: partner.birthday },
      ],
      daysTogether: SAMPLE_HOME.daysTogether,
    }
  },
}
