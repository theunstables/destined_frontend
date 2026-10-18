import { screen, userEvent, waitFor } from '@testing-library/react-native'

import { DAILY_QUESTION_COPY as COPY } from '@/copy/dailyQuestion'
import { DailyQuestionCard } from '@/modules/module-02-home/components/DailyQuestionCard'
import { dailyQuestionService, type DailyQuestion } from '@/services/dailyQuestions'
import { useDailyQuestionStore } from '@/state/dailyQuestionStore'
import { renderScreen } from '@/test/renderScreen'

const QUESTION: DailyQuestion = {
  id: 'question-1',
  date: '2026-10-12',
  prompt: 'What made you feel loved today?',
  status: 'unanswered',
  partnerHasAnswered: false,
}

describe('DailyQuestionCard', () => {
  beforeEach(() => {
    useDailyQuestionStore.getState().reset()
    jest.restoreAllMocks()
  })

  it('requires an answer before calling the service', async () => {
    useDailyQuestionStore.getState().hydrate(QUESTION)
    const answer = jest.spyOn(dailyQuestionService, 'answer')
    await renderScreen(<DailyQuestionCard />)

    await userEvent.press(screen.getByRole('button', { name: COPY.submit }))

    expect(await screen.findByText(COPY.errors.required)).toBeTruthy()
    expect(answer).not.toHaveBeenCalled()
  })

  it('keeps the answer private while waiting for the partner', async () => {
    useDailyQuestionStore.getState().hydrate(QUESTION)
    jest.spyOn(dailyQuestionService, 'answer').mockResolvedValueOnce({
      ok: true,
      value: { ...QUESTION, status: 'waiting', myAnswer: 'A quiet cup of tea.' },
    })
    await renderScreen(<DailyQuestionCard />)

    await userEvent.type(screen.getByLabelText(COPY.eyebrow), 'A quiet cup of tea.')
    await userEvent.press(screen.getByRole('button', { name: COPY.submit }))

    expect(await screen.findByText(COPY.waitingTitle)).toBeTruthy()
    expect(screen.getByText(COPY.waitingBody)).toBeTruthy()
    expect(screen.queryByText(COPY.partnerAnswer)).toBeNull()
  })

  it('reveals both answers only in the complete state', async () => {
    useDailyQuestionStore.getState().hydrate({
      ...QUESTION,
      status: 'complete',
      partnerHasAnswered: true,
      myAnswer: 'Their note.',
      partnerAnswer: 'Our walk.',
    })
    await renderScreen(<DailyQuestionCard />)

    expect(screen.getByText(COPY.myAnswer)).toBeTruthy()
    expect(screen.getByText('Their note.')).toBeTruthy()
    expect(screen.getByText(COPY.partnerAnswer)).toBeTruthy()
    expect(screen.getByText('Our walk.')).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('button', { name: COPY.submit })).toBeNull())
  })

  it('keeps the answer and explains a failed submission', async () => {
    useDailyQuestionStore.getState().hydrate(QUESTION)
    jest.spyOn(dailyQuestionService, 'answer').mockResolvedValueOnce({
      ok: false,
      error: { code: 'NETWORK' },
    })
    const user = userEvent.setup()
    await renderScreen(<DailyQuestionCard />)

    const input = screen.getByLabelText(COPY.eyebrow)
    await user.type(input, 'A quiet cup of tea.')
    await user.press(screen.getByRole('button', { name: COPY.submit }))

    expect(await screen.findByText(COPY.errors.NETWORK)).toBeTruthy()
    expect(input.props.value).toBe('A quiet cup of tea.')
  })

  it('does not submit twice while the first answer is unresolved', async () => {
    useDailyQuestionStore.getState().hydrate(QUESTION)
    let resolveAnswer: ((value: Awaited<ReturnType<typeof dailyQuestionService.answer>>) => void) | undefined
    const answer = jest.spyOn(dailyQuestionService, 'answer').mockImplementation(
      () => new Promise((resolve) => { resolveAnswer = resolve }),
    )
    const user = userEvent.setup()
    await renderScreen(<DailyQuestionCard />)

    await user.type(screen.getByLabelText(COPY.eyebrow), 'A quiet cup of tea.')
    const button = screen.getByRole('button', { name: COPY.submit })
    await user.press(button)
    await user.press(button)

    expect(answer).toHaveBeenCalledTimes(1)
    resolveAnswer?.({ ok: true, value: { ...QUESTION, status: 'waiting' } })
  })
})