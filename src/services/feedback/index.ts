import { isMockMode } from '@/config/env'
import { post } from '@/services/http/client'

export type FeedbackTopic = 'problem' | 'idea' | 'other'
export type FeedbackReceipt = { id: string; status: string; createdAt: string }

type FeedbackService = {
  submit: (input: { topic: FeedbackTopic; message: string }) => Promise<FeedbackReceipt>
}

const mockService: FeedbackService = {
  async submit() {
    return { id: `feedback-${Date.now()}`, status: 'NEW', createdAt: new Date().toISOString() }
  },
}

const httpService: FeedbackService = {
  submit: (input) => post<FeedbackReceipt>('/feedback', input),
}

export const feedbackService = isMockMode ? mockService : httpService
