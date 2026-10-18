import { screen } from '@testing-library/react-native'

import { StoryProgress } from '@/modules/module-01-onboarding/components/StoryProgress'
import { renderScreen } from '@/test/renderScreen'

describe('StoryProgress', () => {
  it('exposes the current step without relying on dot color', async () => {
    await renderScreen(<StoryProgress step={4} />)

    expect(screen.getByRole('progressbar', { name: 'Story step 4 of 7' })).toBeTruthy()
    expect(screen.getByText('4/7')).toBeTruthy()
    expect(screen.getByTestId('story-progress-active')).toBeTruthy()
  })

  it('clamps an out-of-range step', async () => {
    await renderScreen(<StoryProgress step={99} />)

    expect(screen.getByRole('progressbar', { name: 'Story step 7 of 7' })).toBeTruthy()
  })
})