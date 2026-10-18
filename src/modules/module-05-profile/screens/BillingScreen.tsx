import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { SETTINGS_BILLING_COPY as COPY } from '@/copy/settingsBilling'
import { SectionPanel } from '@/design-system/patterns/SectionPanel'
import { SettingsRow } from '@/design-system/patterns/SettingsRow'
import { SettingsScreenLayout } from '@/design-system/patterns/SettingsScreenLayout'
import { Text } from '@/design-system/primitives/Text'
import { PlanCard } from '@/modules/module-05-profile/components/PlanCard'
import { MOCK_INVOICES, MOCK_PLAN, MOCK_PREMIUM, type Invoice, type Plan } from '@/modules/module-05-profile/data/mock'
import { billingService } from '@/services/billing'

/**
 * M05-S17 — Settings → Billing & Subscription.
 *
 * There is no paid tier and no payment integration. Every element on this
 * screen is built so that is visible rather than hidden: the preview note, the
 * disabled upgrade control, the empty-invoice sentence, and a Restore that
 * says there is nothing to restore instead of spinning and claiming success.
 */
export function BillingScreen() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([MOCK_PLAN, MOCK_PREMIUM])
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void billingService.get().then((summary) => {
      setPlans(summary.plans)
      setInvoices(summary.invoices)
    }).catch(() => setError('Billing details could not be loaded.'))
  }, [])

  const goBack = useCallback(() => router.back(), [router])

  return (
    <SettingsScreenLayout title={COPY.title} lede={COPY.lede} onBack={goBack}>
      <SectionPanel title={COPY.currentGroup}>
        <PlanCard
          plan={plans.find((plan) => plan.isCurrent) ?? plans[0] ?? MOCK_PLAN}
          currentLabel={COPY.currentLabel}
          freeLabel={COPY.freeForever}
          periodLabel={COPY.perYear}
          upgradeLabel={COPY.upgrade}
        />
      </SectionPanel>

      <SectionPanel title={COPY.previewGroup}>
        <Text variant="footnote" tone="body">
          {COPY.previewNote}
        </Text>

        <PlanCard
          plan={plans.find((plan) => !plan.isCurrent) ?? MOCK_PREMIUM}
          currentLabel={COPY.currentLabel}
          freeLabel={COPY.free}
          periodLabel={COPY.perYear}
          upgradeLabel={COPY.upgrade}
        />
      </SectionPanel>

      <SectionPanel title={COPY.paymentGroup}>
        {error ? <Text variant="footnote" tone="error">{error}</Text> : null}
        <SettingsRow icon="credit-card" label={COPY.paymentMethod} value={COPY.paymentNone} />
        <SettingsRow icon="refresh-cw" label={COPY.restore} detail={COPY.restoreNothing} />
      </SectionPanel>

      <SectionPanel title={COPY.invoicesGroup}>
        {invoices.length === 0 ? (
          <Text variant="footnote" tone="body">
            {COPY.invoicesEmpty}
          </Text>
        ) : (
          invoices.map((invoice) => (
            <SettingsRow key={invoice.id} icon="file-text" label={invoice.date} />
          ))
        )}
      </SectionPanel>
    </SettingsScreenLayout>
  )
}
