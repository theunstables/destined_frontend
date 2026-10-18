import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useEffect, useState } from 'react'

import { useBackTo } from '@/hooks/useBackTo'
import { COMPATIBILITY_COPY as COPY } from '@/copy/compatibility'
import { AppScreenLayout } from '@/design-system/patterns/AppScreenLayout'
import { Card } from '@/design-system/primitives/Card'
import { Text } from '@/design-system/primitives/Text'
import { compatibilityService, type Compatibility } from '@/services/compatibility'
import { formatDate } from '@/utils/formatStoryDate'
import { elementSynergy, ZODIAC_ELEMENT, ZODIAC_LABEL, ZODIAC_TRAIT, zodiacSignFor } from '@/utils/zodiac'

/**
 * The facts-and-compatibility page behind the Home compatibility card.
 *
 * SAMPLE-ONLY, same as the card that opens it: real compatibility needs the
 * partner's birthday, and the app has no field for that yet. This screen
 * exists so the card has somewhere real to go rather than a dead end, and it
 * renders nothing without sample content on — there is no genuine version of
 * it to fall back to.
 *
 * ONLY POSITIVE FACTS, by design. A sign's trait and the two elements'
 * synergy line are both drawn from `utils/zodiac`, which has no unflattering
 * entry to draw — this is meant to delight, not to score the relationship.
 */
export function CompatibilityScreen() {
  const back = useBackTo('/(app)/home')
  const [compatibility, setCompatibility] = useState<Compatibility | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    void compatibilityService.get().then(setCompatibility).catch(() => setError(true))
  }, [])

  if (!compatibility || compatibility.people.length < 2) {
    return (
      <AppScreenLayout activeTab="home" onBack={back}>
        <Text variant="body" tone="body">
          {error
            ? 'Compatibility details could not be loaded.'
            : compatibility ? 'Add both birthdays in Personal details to see your compatibility.' : 'Loading compatibility…'}
        </Text>
      </AppScreenLayout>
    )
  }

  const [you, partner] = compatibility.people
  const people = [you, partner]
  const signs = people.map((person) => person.birthday ? zodiacSignFor(person.birthday) : null)
  const [youSign, partnerSign] = signs

  return (
    <AppScreenLayout activeTab="home" onBack={back}>
      <View style={styles.head}>
        <Text variant="caption" tone="body">
          {COPY.eyebrow}
        </Text>
        <Text variant="h2" tone="heading">
          {COPY.heading}
        </Text>
      </View>

      <View style={styles.row}>
        {people.map((person, i) => {
          const sign = signs[i]

          return (
            <Card key={person.name}>
              <Text variant="labelStrong" tone="heading">
                {person.name}
              </Text>
              <Text variant="caption" tone="body">
                {person.birthday ? COPY.born(formatDate(person.birthday)) : 'Birthday not added'}
              </Text>
              {sign ? (
                <Text variant="labelStrong" tone="brand">
                  {ZODIAC_LABEL[sign]}
                </Text>
              ) : null}
            </Card>
          )
        })}
      </View>

      {youSign && partnerSign ? (
        <>
          <View style={styles.section}>
            <Text variant="labelStrong" tone="heading">
              {COPY.factsHeading}
            </Text>
            <Text variant="footnote" tone="body">
              {you.name} is {ZODIAC_TRAIT[youSign]}.
            </Text>
            <Text variant="footnote" tone="body">
              {partner.name} is {ZODIAC_TRAIT[partnerSign]}.
            </Text>
          </View>

          <View style={styles.section}>
            <Text variant="labelStrong" tone="heading">
              {COPY.togetherHeading}
            </Text>
            <Text variant="footnote" tone="body">
              {elementSynergy(ZODIAC_ELEMENT[youSign], ZODIAC_ELEMENT[partnerSign])}
            </Text>
          </View>
        </>
      ) : null}

      <View style={styles.section}>
        <Text variant="labelStrong" tone="heading">
          {COPY.detailsHeading}
        </Text>
        <Text variant="footnote" tone="body">
          {compatibility.daysTogether == null
            ? 'Add the day you met to complete this story.'
            : `${compatibility.daysTogether.toLocaleString()} days together and counting.`}
        </Text>
      </View>
    </AppScreenLayout>
  )
}

const styles = StyleSheet.create((theme) => ({
  head: {
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  section: {
    gap: theme.spacing.xs,
  },
}))
