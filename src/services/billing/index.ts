import { isMockMode } from '@/config/env'
import { MOCK_INVOICES, MOCK_PLAN, MOCK_PREMIUM, type Invoice, type Plan } from '@/modules/module-05-profile/data/mock'
import { get } from '@/services/http/client'

type ApiPlan = Omit<Plan, 'isCurrent' | 'isAvailable'> & { current: boolean; available: boolean }

type BillingResponse = {
  currentPlan: string
  providerConfigured: boolean
  plans: ApiPlan[]
  invoices: Invoice[]
}

export type BillingSummary = {
  currentPlan: string
  providerConfigured: boolean
  plans: Plan[]
  invoices: Invoice[]
}

export const billingService = {
  async get(): Promise<BillingSummary> {
    if (isMockMode) {
      return {
        currentPlan: 'free', providerConfigured: false,
        plans: [MOCK_PLAN, MOCK_PREMIUM], invoices: MOCK_INVOICES,
      }
    }
    const response = await get<BillingResponse>('/account/billing')
    return {
      ...response,
      plans: response.plans.map(({ current, available, ...plan }) => ({
        ...plan, isCurrent: current, isAvailable: available,
      })),
    }
  },
}
