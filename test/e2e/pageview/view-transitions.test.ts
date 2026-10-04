import { setup, startServer } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect } from 'vitest'
import { test } from '../../support/browser'
import { browserConfig, fixtureOptions, runtimeEnv } from '../../support/options'

await setup({
  ...fixtureOptions('basic', { ...browserConfig, experimental: { viewTransition: true } }),
  browser: true,
})

beforeEach(async () => {
  await startServer({ env: runtimeEnv })
})

describe('router pageviews with view transitions', () => {
  test('records the fallback title after a view transition from a titled page', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await tracking.navigate('/pageview/untitled-page')
    await tracking.expectPageviews(2, 'view transition')

    expect(tracking.recordedPageviews().at(-1)).toMatchObject({ path: '/pageview/untitled-page', title: 'Fixture app' })
  })

  test('waits for the destination page data during a view transition', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    const request = await tracking.holdRequest('**/api/pageview-title?page=reviews')

    void tracking.push('/pageview/async-title?page=reviews')
    await request.requested
    await tracking.expectPageviews(1, 'page data pending')

    request.release()
    await tracking.waitForRoute('/pageview/async-title?page=reviews')
    await tracking.expectPageviews(2, 'page data loaded')

    expect(tracking.recordedPageviews().at(-1)).toMatchObject({ path: '/pageview/async-title?page=reviews', title: 'Loaded reviews' })
  })

  test('records only the page left on screen when a navigation starts during a view transition', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await Promise.all([
      tracking.push('/pageview/untitled-page'),
      tracking.push('/pageview/other-titled'),
    ])
    await tracking.expectPageviews(2, 'navigation during a view transition')
    const rendered = await tracking.page.locator('main').getAttribute('data-path')

    expect(tracking.pageviewPaths()).toEqual(['/pageview/titled-page', rendered])
    expect(new URL(tracking.page.url()).pathname).toBe(rendered)
  })
})
