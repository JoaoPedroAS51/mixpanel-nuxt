import { setup, startServer } from '@nuxt/test-utils/e2e'
import { describe, expect } from 'vitest'
import { test } from '../../support/browser'
import { browserConfig, fixtureOptions, runtimeEnv } from '../../support/options'

await setup({ ...fixtureOptions('basic', { ...browserConfig, ssr: false }), browser: true })

const modes = [
  { mode: true, query: 1, hash: 1, next: 1, back: 1, forward: 1, redirect: 1, reload: 2 },
  { mode: 'url-with-path', query: 1, hash: 1, next: 2, back: 3, forward: 4, redirect: 5, reload: 6 },
  { mode: 'url-with-path-and-query-string', query: 2, hash: 2, next: 3, back: 4, forward: 5, redirect: 6, reload: 7 },
  { mode: 'full-url', query: 2, hash: 3, next: 4, back: 5, forward: 6, redirect: 7, reload: 8 },
]

const nativeEnv = { ...runtimeEnv, NUXT_PUBLIC_MIXPANEL_CLIENT_PAGEVIEW_STRATEGY: 'native' }

describe('Mixpanel native pageviews in SPA', () => {
  test.for(modes)('records Mixpanel native pageviews for query, hash, history, cancel, redirect and reload with track_pageview: $mode', async (expected, { tracking }) => {
    await startServer({
      env: { ...nativeEnv, NUXT_PUBLIC_MIXPANEL_CLIENT_CONFIG_TRACK_PAGEVIEW: String(expected.mode) },
    })
    await tracking.open()
    await tracking.expectPageviews(1, 'initial visit')

    await tracking.navigate('/one?q=1')
    await tracking.expectPageviews(expected.query, 'query change with component reuse')

    await tracking.navigate('/one?q=1#section')
    await tracking.expectPageviews(expected.hash, 'hash change')

    await tracking.page.getByRole('link', { name: 'Next page' }).click()
    await tracking.waitForRoute('/two')
    await tracking.expectPageviews(expected.next, 'internal navigation')

    await tracking.page.goBack()
    await tracking.waitForRoute('/one?q=1#section')
    await tracking.expectPageviews(expected.back, 'back')

    await tracking.page.goForward()
    await tracking.waitForRoute('/two')
    await tracking.expectPageviews(expected.forward, 'forward')

    await tracking.push('/blocked')
    await tracking.expectPageviews(expected.forward, 'cancelled navigation')
    expect(new URL(tracking.page.url()).pathname).toBe('/two')

    await tracking.push('/redirect')
    await tracking.waitForRoute('/one')
    await tracking.expectPageviews(expected.redirect, 'redirect')

    await tracking.page.reload()
    await tracking.page.waitForSelector('[data-ready="true"]')
    await tracking.expectPageviews(expected.reload, 'reload')
  })
})
