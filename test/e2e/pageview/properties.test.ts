import { setup, startServer } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect } from 'vitest'
import { test } from '../../support/browser'
import type { TrackingPage } from '../../support/browser'
import { fixtureOptions, runtimeEnv } from '../../support/options'

await setup({ ...fixtureOptions(), browser: true })

beforeEach(async () => {
  await startServer({ env: runtimeEnv })
})

type HookMode = Window['__pageviewFixture']['hook']['mode']

function configureHook(tracking: TrackingPage, mode: HookMode, properties: Record<string, unknown> = {}) {
  return tracking.page.evaluate(({ mode, properties }) => {
    Object.assign(window.__pageviewFixture.hook, { mode, properties })
  }, { mode, properties })
}

function hookCalls(tracking: TrackingPage) {
  return tracking.page.evaluate(() => window.__pageviewFixture.hook.calls.map(({ path, aborted }) => ({ path, aborted })))
}

function releaseHookCall(tracking: TrackingPage, index: number) {
  return tracking.page.evaluate(call => window.__pageviewFixture.hook.calls[call]!.release(), index)
}

function lastProperties(tracking: TrackingPage) {
  return tracking.recordedPageviews().at(-1)?.properties
}

describe('router pageview properties', () => {
  test('sends the route name with every pageview', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await tracking.navigate('/pageview/kept-1')
    await tracking.expectPageviews(2, 'two pages')

    expect(tracking.recordedPageviews().map(pageview => pageview.properties.route_name)).toEqual(['pageview-titled-page', 'pageview-kept-id'])
  })

  test('sends the properties declared in page meta', async ({ tracking }) => {
    await tracking.open('/pageview/with-properties')
    await tracking.expectPageviews(1, 'page with meta properties')

    expect(lastProperties(tracking)).toMatchObject({ route_name: 'pageview-with-properties', section: 'static' })
  })

  test('merges page meta properties from the parent route into the child route', async ({ tracking }) => {
    await tracking.open('/pageview/nested-parent/child-page')
    await tracking.expectPageviews(1, 'nested page')

    expect(lastProperties(tracking)).toMatchObject({ section: 'nested', area: 'child' })
  })

  test.for(['/pageview/excluded-page', '/pageview/nested-parent/excluded-page'])('records nothing and skips the hook on %s', async (path, { tracking }) => {
    await tracking.open('/pageview/titled-page')
    await configureHook(tracking, 'async')
    await tracking.navigate(path)
    await tracking.expectPageviews(1, 'page with pageview: false')

    expect(await hookCalls(tracking)).toEqual([])
  })

  test('adds the properties set by a hook handler', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await configureHook(tracking, 'sync', { plan_tier: 'gold' })
    await tracking.navigate('/pageview/other-titled')
    await tracking.expectPageviews(2, 'navigation with hook properties')

    expect(lastProperties(tracking)).toMatchObject({ route_name: 'pageview-other-titled', plan_tier: 'gold' })
  })

  test('lets a hook handler replace page meta properties', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await configureHook(tracking, 'sync', { area: 'hook' })
    await tracking.navigate('/pageview/nested-parent/child-page')
    await tracking.expectPageviews(2, 'hook replacing meta')

    expect(lastProperties(tracking)).toMatchObject({ section: 'nested', area: 'hook' })
  })

  test('waits for an asynchronous hook handler before sending the pageview', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await configureHook(tracking, 'async', { product: 'manager' })
    await tracking.navigate('/pageview/other-titled')
    await expect.poll(() => hookCalls(tracking)).toHaveLength(1)
    await tracking.expectPageviews(1, 'hook pending')

    await releaseHookCall(tracking, 0)
    await tracking.expectPageviews(2, 'hook resolved')

    expect(lastProperties(tracking)).toMatchObject({ product: 'manager', hook_path: '/pageview/other-titled' })
  })

  test('drops the pageview and aborts the signal when a navigation replaces the hook', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await configureHook(tracking, 'async')
    await tracking.navigate('/pageview/other-titled')
    await tracking.navigate('/pageview/untitled-page')
    await expect.poll(() => hookCalls(tracking)).toHaveLength(2)

    await releaseHookCall(tracking, 0)
    await releaseHookCall(tracking, 1)
    await tracking.expectPageviews(2, 'replaced hook')

    expect(await hookCalls(tracking)).toEqual([
      { path: '/pageview/other-titled', aborted: true },
      { path: '/pageview/untitled-page', aborted: false },
    ])
    expect(tracking.recordedPageviews().at(-1)?.path).toBe('/pageview/untitled-page')
  })

  test('runs no hook for a query change that the URL mode does not record', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await configureHook(tracking, 'async')
    await tracking.navigate('/pageview/titled-page?tab=reviews')
    await tracking.expectPageviews(1, 'query change with url-with-path')

    expect(await hookCalls(tracking)).toEqual([])
  })

  test('drops the pageview when a hook handler sets skip', async ({ tracking }) => {
    await tracking.open('/pageview/titled-page')
    await configureHook(tracking, 'skip')
    await tracking.navigate('/pageview/other-titled')
    await tracking.expectPageviews(1, 'skipped pageview')
  })

  test('logs a failing hook handler and sends the pageview without the properties it added', async ({ tracking }) => {
    const errors: string[] = []
    tracking.page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })

    await tracking.open('/pageview/titled-page')
    await configureHook(tracking, 'error', { plan_tier: 'gold' })
    await tracking.navigate('/pageview/with-properties')
    await tracking.expectPageviews(2, 'pageview after a failing hook')

    expect(lastProperties(tracking)).toMatchObject({ route_name: 'pageview-with-properties', section: 'static' })
    expect(lastProperties(tracking)).not.toHaveProperty('plan_tier')
    expect(errors).toEqual([expect.stringContaining('A mixpanel:pageview handler failed')])
  })
})
