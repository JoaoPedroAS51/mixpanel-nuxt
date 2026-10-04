import { setup, startServer, url } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect } from 'vitest'
import { test } from '../../support/browser'
import { fixtureOptions, runtimeEnv } from '../../support/options'

await setup({ ...fixtureOptions(), browser: true })

beforeEach(async () => {
  await startServer({ env: runtimeEnv })
})

describe('router pageview navigation', () => {
  test('records the initial visit after hydration with the route name', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await tracking.expectPageviews(1, 'initial visit')

    expect(tracking.recordedPageviews()).toMatchObject([
      { path: '/pageview/titled-page', title: 'Titled page', properties: { route_name: 'pageview-titled-page', $mp_autocapture: true } },
    ])
  })

  test('records link navigation, history and a reload after SSR hydration', async ({ tracking }) => {
    await tracking.open('/one')
    await tracking.page.getByRole('link', { name: 'Next page' }).click()
    await tracking.waitForRoute('/two')
    await tracking.page.goBack()
    await tracking.waitForRoute('/one')
    await tracking.page.goForward()
    await tracking.waitForRoute('/two')
    await tracking.page.reload()
    await tracking.page.waitForSelector('[data-ready="true"]')
    await tracking.expectPageviews(5, 'navigation, history and reload')

    expect(tracking.pageviewPaths()).toEqual(['/one', '/two', '/one', '/two', '/two'])
  })

  test('records nothing when a guard cancels a programmatic navigation', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await tracking.push('/blocked')
    await tracking.expectPageviews(1, 'cancelled navigation')

    expect(new URL(tracking.page.url()).pathname).toBe('/pageview/titled-page')
  })

  test('records nothing when a guard cancels a back navigation', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await tracking.navigate('/pageview/other-titled')
    await tracking.page.evaluate(() => {
      window.__pageviewFixture.guard.blocked = '/pageview/titled-page'
    })
    await tracking.page.goBack()
    await expect.poll(() => tracking.page.evaluate(() => window.__pageviewFixture.guard.cancelled)).toBe(1)
    await tracking.page.waitForURL('**/pageview/other-titled')
    await tracking.expectPageviews(2, 'cancelled back navigation')

    expect(tracking.pageviewPaths()).toEqual(['/pageview/titled-page', '/pageview/other-titled'])
  })

  test('records only the final destination of a redirect', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await tracking.push('/redirect')
    await tracking.waitForRoute('/one')
    await tracking.expectPageviews(2, 'redirect')

    expect(tracking.pageviewPaths()).toEqual(['/pageview/titled-page', '/one'])
  })

  test('records only the final destination of a redirected back navigation', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await tracking.navigate('/pageview/other-titled')
    await tracking.page.evaluate(() => {
      window.__pageviewFixture.guard.redirects['/pageview/titled-page'] = '/pageview/untitled-page'
    })
    await tracking.page.goBack()
    await tracking.waitForRoute('/pageview/untitled-page')
    await tracking.expectPageviews(3, 'redirected back navigation')

    expect(tracking.pageviewPaths()).toEqual(['/pageview/titled-page', '/pageview/other-titled', '/pageview/untitled-page'])
  })

  test('records a client navigation to a missing route and the next page after the error page', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await tracking.push('/pageview/missing')
    await tracking.page.waitForURL('**/pageview/missing')
    await tracking.expectPageviews(2, 'error page')

    await tracking.navigate('/pageview/titled-page')
    await tracking.expectPageviews(3, 'navigation after the error page')

    const [, errorPage, recovered] = tracking.recordedPageviews()
    expect(errorPage?.path).toBe('/pageview/missing')
    expect(errorPage?.title).not.toBe('Titled page')
    expect(recovered).toMatchObject({ path: '/pageview/titled-page', title: 'Titled page' })
  })

  test('records a server-rendered error page and the next page after it', async ({ tracking }) => {
    await tracking.page.goto(url('/pageview/missing'), { waitUntil: 'hydration' })
    await tracking.expectPageviews(1, 'server-rendered error page')

    await tracking.navigate('/pageview/titled-page')
    await tracking.expectPageviews(2, 'navigation after the error page')

    expect(tracking.recordedPageviews()).toMatchObject([
      { path: '/pageview/missing' },
      { path: '/pageview/titled-page', title: 'Titled page' },
    ])
  })

  test.for([
    { mode: true, query: 1, hash: 1, path: 1 },
    { mode: 'url-with-path', query: 1, hash: 1, path: 2 },
    { mode: 'url-with-path-and-query-string', query: 2, hash: 2, path: 3 },
    { mode: 'full-url', query: 2, hash: 3, path: 4 },
  ])('counts pageviews for query, hash and path changes on a reused page with track_pageview: $mode', async (expected, { tracking }) => {
    await startServer({
      env: { ...runtimeEnv, NUXT_PUBLIC_MIXPANEL_CLIENT_CONFIG_TRACK_PAGEVIEW: String(expected.mode) },
    })
    await tracking.open('/pageview/untitled-page')
    await tracking.expectPageviews(1, 'initial visit')

    await tracking.navigate('/pageview/untitled-page?q=1')
    await tracking.expectPageviews(expected.query, 'query change')

    await tracking.navigate('/pageview/untitled-page?q=1#section')
    await tracking.expectPageviews(expected.hash, 'hash change')

    await tracking.navigate('/pageview/titled-page')
    await tracking.expectPageviews(expected.path, 'path change')
  })
})
