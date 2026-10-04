import { setup, startServer, useTestContext } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect } from 'vitest'
import { test } from '../../support/browser'
import type { TrackingPage } from '../../support/browser'
import { fixtureOptions, runtimeEnv } from '../../support/options'

await setup({ ...fixtureOptions('nuxt5-compat'), browser: true })

beforeEach(async () => {
  await startServer({ env: runtimeEnv })
})

/** Navigate while the leave transition is held, check that nothing is sent, then release it. */
async function navigateThroughHeldLeave(tracking: TrackingPage, path: string) {
  void tracking.push(path)
  await expect.poll(() => tracking.page.evaluate(() => window.__pageviewFixture.heldLeaves.length)).toBe(1)
  await tracking.expectPageviews(1, 'leave transition held')

  await tracking.page.evaluate(() => window.__pageviewFixture.releaseLeaves())
  await tracking.waitForRoute(path)
  await tracking.expectPageviews(2, 'leave transition finished')
}

describe('router pageviews with compatibilityVersion 5', () => {
  test('builds the fixture with compatibilityVersion 5', () => {
    expect(useTestContext().nuxt!.options.future.compatibilityVersion).toBe(5)
  })

  test('records the initial visit after hydration with the route name', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await tracking.expectPageviews(1, 'initial visit')

    expect(tracking.recordedPageviews()).toMatchObject([
      { path: '/pageview/titled-page', title: 'Titled page', properties: { route_name: 'pageview-titled-page' } },
    ])
  })

  test('records link navigation, history and a middleware redirect', async ({ tracking }) => {
    await tracking.open('/one')
    await tracking.page.getByRole('link', { name: 'Next page' }).click()
    await tracking.waitForRoute('/two')
    await tracking.page.goBack()
    await tracking.waitForRoute('/one')
    await tracking.push('/redirect')
    await tracking.expectPageviews(3, 'navigation, history and redirect')

    expect(tracking.pageviewPaths()).toEqual(['/one', '/two', '/one'])
  })

  test('waits for the destination page to load its title', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    const request = await tracking.holdRequest('**/api/pageview-title?page=reviews')

    void tracking.push('/pageview/async-title?page=reviews')
    await request.requested
    await tracking.expectPageviews(1, 'page data pending')

    request.release()
    await tracking.waitForRoute('/pageview/async-title?page=reviews')
    await tracking.expectPageviews(2, 'page data loaded')

    expect(tracking.recordedPageviews().at(-1)).toMatchObject({ title: 'Loaded reviews' })
  })

  test.for([
    { name: 'page', from: '/pageview/titled-page?pageTransition=default', to: '/pageview/untitled-page' },
    { name: 'layout', from: '/pageview/first-layout', to: '/pageview/second-layout' },
  ])('records the fallback title after a $name transition from a titled page', async ({ from, to }, { tracking }) => {
    await tracking.open(from)
    await navigateThroughHeldLeave(tracking, to)

    expect(tracking.recordedPageviews().at(-1)).toMatchObject({ path: to, title: 'Fixture app' })
  })

  test('records a navigation between routes that share a page key', async ({ tracking }) => {
    await tracking.open('/pageview/shared-1')
    await tracking.navigate('/pageview/shared-2')
    await tracking.expectPageviews(2, 'shared page key')

    expect(tracking.recordedPageviews().at(-1)).toMatchObject({ path: '/pageview/shared-2', title: 'Shared 2' })
  })
})
