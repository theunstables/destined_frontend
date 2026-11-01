import { test, expect } from '@playwright/test'
import axe from 'axe-core'

const publicPages = ['/welcome', '/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/verify-email']
const forms = [
  { path: '/sign-in', field: 'Password', button: 'Sign In', endpoint: '/auth/login' },
  { path: '/sign-up', field: 'Password', button: 'Create Account', endpoint: '/auth/signup' },
  { path: '/forgot-password', field: 'Email address', button: 'Send Reset Link', endpoint: '/auth/password/forgot' },
]

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
      await route.continue()
    } else {
      await route.abort('blockedbyclient')
    }
  })
})

test('welcome renders the primary action', async ({ page }) => {
  await page.goto('/welcome')
  await expect(page.getByRole('button', { name: 'Get Started', exact: true })).toBeVisible()
})

for (const path of publicPages) {
  test(`${path}: passes automated WCAG A/AA checks`, async ({ page }, testInfo) => {
    await page.goto(path)
    await expect(page.getByRole('button').first()).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await page.addScriptTag({ content: axe.source })
    const results = await page.evaluate(async () => window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
    }))
    await testInfo.attach('accessibility-results', {
      body: JSON.stringify({ violations: results.violations, incomplete: results.incomplete }, null, 2),
      contentType: 'application/json',
    })
    expect(results.violations).toEqual([])
  })

  test(`${path}: loads without uncaught errors or broken images`, async ({ page }) => {
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    const response = await page.goto(path)
    expect(response.status()).toBe(200)
    await expect(page.getByRole('button').first()).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await expect.poll(() => page.locator('img').evaluateAll((images) => images.filter(
      (image) => image.getClientRects().length > 0 && (!image.complete || image.naturalWidth === 0),
    ).map((image) => image.src))).toEqual([])
    expect(errors).toEqual([])
  })

  test(`${path}: has a meaningful browser title`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('button').first()).toBeVisible()
    await expect(page).toHaveTitle(/\S+/)
  })

  test(`${path}: exposes a visible page heading`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('button').first()).toBeVisible()
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test(`${path}: controls fit at narrow mobile width`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto(path)
    await expect(page.getByRole('button').first()).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      clipped: [...document.querySelectorAll('input,button,[role="link"]')].filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1)
      }).map((element) => element.getAttribute('aria-label') || element.textContent),
    }))
    expect(layout).toEqual({ overflow: false, clipped: [] })
  })
}

for (const scenario of [
  { path: '/welcome', link: 'Sign In', target: '/sign-in' },
  { path: '/sign-in', link: 'Create an account', target: '/sign-up' },
  { path: '/sign-in', link: 'Forgot password?', target: '/forgot-password' },
  { path: '/sign-up', link: 'Sign In', target: '/sign-in' },
]) {
  test(`${scenario.path}: ${scenario.link} supports keyboard activation`, async ({ page }) => {
    await page.goto(scenario.path)
    const link = page.getByRole('link', { name: scenario.link, exact: true })
    await link.focus()
    await expect(link).toBeFocused()
    await link.press('Enter')
    await expect(page).toHaveURL(new RegExp(`${scenario.target}$`))
  })

  test(`${scenario.path}: ${scenario.link} supports pointer navigation`, async ({ page }) => {
    await page.goto(scenario.path)
    await page.getByRole('link', { name: scenario.link, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${scenario.target}$`))
  })
}

for (const form of forms) {
  test(`${form.path}: empty submission validates email without an API call`, async ({ page }) => {
    const writes = []
    page.on('request', (request) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url())
    })
    await page.goto(form.path)
    await page.getByRole('button', { name: form.button, exact: true }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Enter your email address' })).toBeVisible()
    expect(writes).toEqual([])
  })

  for (const activation of ['Enter', 'click']) {
    test(`${form.path}: ${activation} submits valid fields (intercepted API)`, async ({ page }) => {
      const requests = []
      await page.route(`**/v1${form.endpoint}`, async (route) => {
        requests.push({ method: route.request().method(), body: route.request().postDataJSON() })
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Controlled QA response' } }),
        })
      })
      await page.goto(form.path)
      await page.getByRole('textbox', { name: 'Email address', exact: true }).fill('qa@example.invalid')
      if (form.field === 'Password') {
        await page.getByRole('textbox', { name: 'Password', exact: true }).fill('Invalid-QA-927!')
      }
      if (activation === 'Enter') {
        await page.getByRole('textbox', { name: form.field, exact: true }).press('Enter')
      } else {
        await page.getByRole('button', { name: form.button, exact: true }).click()
      }
      await expect.poll(() => requests).toHaveLength(1)
      expect(requests[0]).toMatchObject({ method: 'POST', body: { email: 'qa@example.invalid' } })
      await expect(page.getByRole('alert').first()).toBeVisible()
      await expect(page.getByRole('button', { name: form.button, exact: true })).toBeEnabled()
    })
  }
}

for (const path of ['/sign-in', '/sign-up']) {
  test(`${path}: password reveal toggles without losing the value`, async ({ page }) => {
    await page.goto(path)
    const password = page.getByRole('textbox', { name: 'Password', exact: true })
    await password.fill('Invalid-QA-927!')
    await expect(password).toHaveJSProperty('type', 'password')
    await page.getByRole('button', { name: 'Show password', exact: true }).click()
    await expect(password).toHaveJSProperty('type', 'text')
    await expect(password).toHaveValue('Invalid-QA-927!')
    await page.getByRole('button', { name: 'Hide password', exact: true }).click()
    await expect(password).toHaveJSProperty('type', 'password')
    await expect(password).toHaveValue('Invalid-QA-927!')
  })
}

for (const path of ['/home', '/calendar', '/chat', '/memories', '/timeline', '/profile', '/plans', '/bingo', '/plans/capsules', '/setup']) {
  test(`${path}: signed-out deep links cannot enter private screens`, async ({ page }) => {
    await page.goto(path)
    await expect(page).toHaveURL(/\/(welcome|sign-in)$/)
    await expect(page.getByRole('button', { name: /^(Get Started|Sign In)$/ })).toBeVisible()
  })
}

test('verification without a session or token returns to authentication', async ({ page }) => {
  await page.goto('/verify-email')
  await expect(page).toHaveURL(/\/(welcome|sign-in)$/)
})

test('reset without a token offers a working recovery action', async ({ page }) => {
  await page.goto('/reset-password')
  await expect(page.getByRole('heading', { name: /reset link is no longer valid/i })).toBeVisible()
  await page.getByRole('button', { name: 'Request a new link', exact: true }).click()
  await expect(page).toHaveURL(/\/forgot-password$/)
  await expect(page.getByRole('textbox', { name: 'Email address', exact: true })).toBeVisible()
})

for (const activation of ['rapid click', 'rapid Space', 'settled click']) {
  test(`recovery: ${activation} resend handles failure and retry privately (intercepted API)`, async ({ page }) => {
    const requests = []
    await page.route('**/v1/auth/password/forgot', async (route) => {
      requests.push({ method: route.request().method(), body: route.request().postDataJSON() })
      await route.fulfill({
        status: requests.length === 2 ? 429 : 202,
        contentType: 'application/json',
        body: JSON.stringify(requests.length === 2
          ? { error: { code: 'RATE_LIMITED', message: 'Controlled QA response' } }
          : { data: null, meta: {}, requestId: 'qa-recovery' }),
      })
    })
    await page.goto('/forgot-password')
    await page.getByRole('textbox', { name: 'Email address', exact: true }).fill('qa@example.invalid')
    await page.clock.install()
    await page.getByRole('button', { name: 'Send Reset Link', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Check your email', exact: true })).toBeVisible()
    await expect(page.getByText('If qa@example.invalid has an account, a reset link is on its way.', { exact: true })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Email address', exact: true })).toHaveCount(0)
    expect(requests).toHaveLength(1)
    const resend = page.getByRole('button', { name: 'Resend', exact: true })
    await expect(resend).toBeEnabled()
    if (activation === 'settled click') await page.clock.runFor(650)
    if (activation === 'rapid Space') await resend.press('Space')
    else await resend.click()
    await expect.poll(() => requests, { message: 'Resend must issue a second recovery request' }).toHaveLength(2)
    await expect(page.getByRole('alert')).toHaveText('Too many attempts. Wait a moment and try again.')
    await expect(resend).toBeEnabled()
    await page.clock.runFor(650)
    if (activation === 'rapid Space') await resend.press('Space')
    else await resend.click()
    await expect.poll(() => requests).toHaveLength(3)
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(resend).toBeEnabled()
    expect(requests).toEqual(Array.from({ length: 3 }, () => ({ method: 'POST', body: { email: 'qa@example.invalid' } })))
    await page.getByRole('button', { name: 'Back to Sign In', exact: true }).click()
    await expect(page).toHaveURL(/\/sign-in$/)
  })
}