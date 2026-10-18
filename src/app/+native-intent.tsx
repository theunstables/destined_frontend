const safePath = (path: string): string => {
  try {
    const url = new URL(path, 'talesoftwo://app')
    const isWebLink = url.protocol === 'https:' || url.protocol === 'http:'
    const route = isWebLink || url.hostname === 'app'
      ? url.pathname
      : `/${url.hostname}${url.pathname}`
    const query = url.search

    if (route === '/verify-email') return `/(auth)/verify-email${query}`
    if (route === '/reset-password') return `/(auth)/reset-password${query}`
    if (route === '/pair' || route === '/enter-code') return `/(onboarding)/enter-code${query}`
    if (route === '/home' || route === '/daily-question' || route === '/repair-signal') {
      return `/(app)/home${query}`
    }
    if (route === '/chat') return `/(app)/chat/conversation${query}`
    if (route === '/memories') return `/(app)/memories${query}`
    if (route === '/calendar') return `/(app)/calendar${query}`
    if (route === '/timeline') return `/(app)/timeline${query}`
    if (route === '/plans') return `/(app)/plans${query}`
    if (route === '/plans/watch' || route === '/plans/watch-together') {
      return `/(app)/plans/watch${query}`
    }
    if (route === '/plans/places' || route === '/plans/shared-places') {
      return `/(app)/plans/places${query}`
    }
    if (route === '/compatibility') return `/(app)/compatibility${query}`
    if (route === '/account/partner') return `/(app)/settings/partner${query}`
    if (route === '/account/delete') return `/(app)/settings/delete-account${query}`
    if (route === '/account/billing') return `/(app)/settings/billing${query}`
    if (route === '/account/data') return `/(app)/settings/data${query}`
    if (route === '/feedback') return `/(app)/settings/feedback${query}`
    if (/^\/memories\/[A-Za-z0-9-]+$/.test(route)) return `/(app)${route}${query}`
    if (/^\/occasions\/[A-Za-z0-9-]+$/.test(route)) return `/(app)${route}${query}`
    if (/^\/plans\/letters\/[A-Za-z0-9-]+$/.test(route)) return `/(app)${route}${query}`
    if (/^\/plans\/capsules\/[A-Za-z0-9-]+$/.test(route)) return `/(app)${route}${query}`
  } catch {
    // Untrusted links fall through to the guarded app entry point.
  }
  return '/'
}

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return safePath(path)
}
