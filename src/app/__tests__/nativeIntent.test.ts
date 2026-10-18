import { redirectSystemPath } from '../+native-intent'

describe('native deep-link routing', () => {
  const route = (path: string) => redirectSystemPath({ path, initial: true })

  it('routes authentication links and preserves their token query', () => {
    expect(route('talesoftwo://verify-email?token=abc-123'))
      .toBe('/(auth)/verify-email?token=abc-123')
    expect(route('https://example.test/reset-password?token=reset-123'))
      .toBe('/(auth)/reset-password?token=reset-123')
  })

  it('routes pairing and authenticated app destinations', () => {
    expect(route('talesoftwo://pair?code=ABC123'))
      .toBe('/(onboarding)/enter-code?code=ABC123')
    expect(route('talesoftwo://memories')).toBe('/(app)/memories')
    expect(route('talesoftwo://plans/watch-together')).toBe('/(app)/plans/watch')
    expect(route('talesoftwo://plans/shared-places')).toBe('/(app)/plans/places')
    expect(route('talesoftwo://account/billing')).toBe('/(app)/settings/billing')
  })

  it('allows safe identifiers and rejects unknown or malformed destinations', () => {
    expect(route('talesoftwo://memories/123e4567-e89b-12d3-a456-426614174000?source=email'))
      .toBe('/(app)/memories/123e4567-e89b-12d3-a456-426614174000?source=email')
    expect(route('talesoftwo://plans/capsules/capsule-123'))
      .toBe('/(app)/plans/capsules/capsule-123')
    expect(route('talesoftwo://plans/capsules/../../settings')).toBe('/')
    expect(route('talesoftwo://unknown')).toBe('/')
  })
})
