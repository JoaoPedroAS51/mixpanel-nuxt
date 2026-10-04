import { setup, startServer } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect } from 'vitest'
import { test } from '../../support/browser'
import type { TrackingPage } from '../../support/browser'
import { fixtureOptions, runtimeEnv } from '../../support/options'

await setup({ ...fixtureOptions(), browser: true })

const autocaptureEnv = { ...runtimeEnv, NUXT_PUBLIC_MIXPANEL_CLIENT_CONFIG_AUTOCAPTURE: 'true' }

beforeEach(async () => {
  await startServer({ env: autocaptureEnv })
})

function scrollTo(tracking: TrackingPage, fraction: number) {
  return tracking.page.evaluate((fraction) => {
    window.scrollTo(0, fraction * (document.body.scrollHeight - window.innerHeight))
  }, fraction)
}

function scrollCheckpoints(tracking: TrackingPage, path: string) {
  return tracking.events
    .filter(event => event.event === '$mp_scroll' && String(event.properties?.$current_url).endsWith(path))
    .map(event => event.properties?.$scroll_checkpoint)
    .filter(checkpoint => checkpoint !== undefined)
}

describe('router pageviews with autocapture', () => {
  test('records one autocapture pageview per navigation and keeps autocapture clicks', async ({ tracking }) => {
    await tracking.open('/one')
    await tracking.page.getByRole('button', { name: 'Track event' }).click()
    await tracking.navigate('/pageview/titled-page')
    await tracking.expectPageviews(2, 'autocapture with router pageviews')

    expect(tracking.recordedPageviews().map(pageview => pageview.properties.$mp_autocapture)).toEqual([true, true])
    await expect.poll(() => tracking.events.filter(event => event.event === '$mp_click')).not.toHaveLength(0)
  })

  test('sends scroll checkpoints again on the next page after reaching 100%', async ({ tracking }) => {
    await tracking.open('/pageview/long-1')
    await scrollTo(tracking, 1)
    await expect.poll(() => scrollCheckpoints(tracking, '/pageview/long-1')).toContain(100)

    await tracking.navigate('/pageview/long-2')
    await tracking.expectPageviews(2, 'navigation between scrollable pages')
    await scrollTo(tracking, 0.3)

    await expect.poll(() => scrollCheckpoints(tracking, '/pageview/long-2')).toEqual([25])
  })
})
