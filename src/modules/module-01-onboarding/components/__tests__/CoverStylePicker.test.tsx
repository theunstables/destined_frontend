import { screen, userEvent } from '@testing-library/react-native'

import { CoverStylePicker } from '@/modules/module-01-onboarding/components/CoverStylePicker'
import { renderScreen } from '@/test/renderScreen'

const OPTIONS = [
  { value: 'dawn' as const, label: 'Dawn' },
  { value: 'dusk' as const, label: 'Dusk' },
  { value: 'night' as const, label: 'Night' },
]

describe('CoverStylePicker', () => {
  it('renders three named visual choices and exposes selection', async () => {
    const onChange = jest.fn()
    await renderScreen(
      <CoverStylePicker
        label="Choose a cover style"
        options={OPTIONS}
        value="dusk"
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('radio', { name: 'Dusk' }).props.accessibilityState).toEqual({
      selected: true,
    })

    await userEvent.press(screen.getByRole('radio', { name: 'Night' }))
    expect(onChange).toHaveBeenCalledWith('night')
  })
})