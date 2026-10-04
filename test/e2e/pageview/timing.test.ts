import { setup, startServer } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect } from 'vitest'
import { test } from '../../support/browser'
import type { TrackingPage } from '../../support/browser'
import { fixtureOptions, runtimeEnv } from '../../support/options'

await setup({ ...fixtureOptions(), browser: true })

beforeEach(async () => {
  await startServer({ env: runtimeEnv })
})

async function waitForHeldLeaves(tracking: TrackingPage, count: number) {
  await expect.poll(() => tracking.page.evaluate(() => window.__pageviewFixture.heldLeaves.length)).toBe(count)
}

function releaseLeaves(tracking: TrackingPage) {
  return tracking.page.evaluate(() => window.__pageviewFixture.releaseLeaves())
}

function lastPageview(tracking: TrackingPage) {
  return tracking.recordedPageviews().at(-1)
}

/** Navigate while the leave transition is held, check that nothing is sent, then release it. */
async function navigateThroughHeldLeave(tracking: TrackingPage, path: string) {
  void tracking.push(path)
  await waitForHeldLeaves(tracking, 1)
  await tracking.expectPageviews(1, 'leave transition held')

  await releaseLeaves(tracking)
  await tracking.waitForRoute(path)
  await tracking.expectPageviews(2, 'leave transition finished')
}

describe('router pageview timing', () => {
  test('waits for the destination page to load its title', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    const request = await tracking.holdRequest('**/api/pageview-title?page=reviews')

    void tracking.push('/pageview/async-title?page=reviews')
    await request.requested
    await tracking.expectPageviews(1, 'page data pending')

    request.release()
    await tracking.waitForRoute('/pageview/async-title?page=reviews')
    await tracking.expectPageviews(2, 'page data loaded')

    expect(lastPageview(tracking)).toMatchObject({ path: '/pageview/async-title?page=reviews', title: 'Loaded reviews' })
  })

  test.for(['out-in', 'in-out', 'default'])('records the fallback title after a %s page transition from a titled page', async (mode, { tracking }) => {
    await tracking.open(`/pageview/titled-page?pageTransition=${mode}`)
    await navigateThroughHeldLeave(tracking, '/pageview/untitled-page')

    expect(lastPageview(tracking)).toMatchObject({ path: '/pageview/untitled-page', title: 'Fixture app' })
  })

  test('records the fallback title after a page transition declared in page meta', async ({ tracking }) => {
    await tracking.open('/pageview/titled-meta-transition')
    await navigateThroughHeldLeave(tracking, '/pageview/meta-transition')

    expect(lastPageview(tracking)).toMatchObject({ path: '/pageview/meta-transition', title: 'Fixture app' })
  })

  test('records the fallback title after a layout transition from a titled page', async ({ tracking }) => {
    await tracking.open('/pageview/first-layout')
    await navigateThroughHeldLeave(tracking, '/pageview/second-layout')

    expect(lastPageview(tracking)).toMatchObject({ path: '/pageview/second-layout', title: 'Fixture app' })
  })

  test.for([
    { name: 'a guard cancels', push: '/blocked', recorded: '/pageview/async-title?page=reviews' },
    { name: 'duplicates the loading page', push: '/pageview/async-title?page=reviews', recorded: '/pageview/async-title?page=reviews' },
    { name: 'changes only the query of the loading page', push: '/pageview/async-title?page=reviews&tab=1', recorded: '/pageview/async-title?page=reviews&tab=1' },
  ])('waits for the loading page when a navigation that $name happens meanwhile', async ({ push, recorded }, { tracking }) => {
    await tracking.open('/pageview/titled-page')
    const request = await tracking.holdRequest('**/api/pageview-title?page=reviews')

    void tracking.push('/pageview/async-title?page=reviews')
    await request.requested
    await tracking.push(push)
    await tracking.expectPageviews(1, 'page data pending after another navigation')

    request.release()
    await tracking.waitForRoute(recorded)
    await tracking.expectPageviews(2, 'page data loaded')

    expect(lastPageview(tracking)).toMatchObject({ path: recorded, title: 'Loaded reviews' })
  })

  test('records only the navigation that replaces a page still loading its data', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    const request = await tracking.holdRequest('**/api/pageview-title?page=slow')

    void tracking.push('/pageview/async-title?page=slow')
    await request.requested
    await tracking.navigate('/pageview/other-titled')
    request.release()
    await tracking.expectPageviews(2, 'replaced navigation')

    expect(tracking.recordedPageviews()).toMatchObject([
      { path: '/pageview/titled-page' },
      { path: '/pageview/other-titled', title: 'Other titled page' },
    ])
  })

  test('records only the navigation that replaces a held leave transition', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page?pageTransition=default')

    void tracking.push('/pageview/untitled-page')
    await waitForHeldLeaves(tracking, 1)
    void tracking.push('/pageview/other-titled')
    await waitForHeldLeaves(tracking, 2)
    await releaseLeaves(tracking)
    await tracking.waitForRoute('/pageview/other-titled')
    await tracking.expectPageviews(2, 'replaced transition')

    expect(tracking.recordedPageviews()).toMatchObject([
      { path: '/pageview/titled-page?pageTransition=default' },
      { path: '/pageview/other-titled', title: 'Other titled page' },
    ])
  })

  test('records a return to a page kept alive', async ({ tracking }) => {
    await tracking.open('/pageview/kept-1')
    await tracking.navigate('/pageview/titled-page')
    await tracking.navigate('/pageview/kept-1')
    await tracking.expectPageviews(3, 'return to a kept-alive page')

    expect(lastPageview(tracking)).toMatchObject({ path: '/pageview/kept-1', title: 'Fixture app' })
  })

  test('records a navigation between routes that share a page key', async ({ tracking }) => {
    await tracking.open('/pageview/shared-1')
    await tracking.navigate('/pageview/shared-2')
    await tracking.expectPageviews(2, 'shared page key')

    expect(lastPageview(tracking)).toMatchObject({ path: '/pageview/shared-2', title: 'Shared 2' })
  })

  test.for([
    { source: 'plugin', path: '/pageview/untitled-page?identify=plugin' },
    { source: 'middleware', path: '/pageview/untitled-page?identify=middleware' },
    { source: 'setup', path: '/pageview/identified-page' },
  ])('sends identity and super properties set in a $source with the first pageview', async ({ source, path }, { tracking }) => {
    await tracking.open(path)
    await tracking.expectPageviews(1, 'initial visit')

    expect(lastPageview(tracking)?.properties).toMatchObject({ distinct_id: `${source}-user`, plan: source })
  })
})
