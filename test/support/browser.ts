import { createPage, url } from '@nuxt/test-utils/e2e'
import { expect, test as base } from 'vitest'
import { setTimeout as sleep } from 'node:timers/promises'
import { decodeEvents } from './events'
import type { CapturedEvent } from './events'

const PAGEVIEW_EVENT = '$mp_web_page_view'

export interface RecordedPageview {
  path: string
  title: unknown
  properties: Record<string, unknown>
}

async function createTrackingPage() {
  const page = await createPage()
  const events: CapturedEvent[] = []
  const errors: string[] = []

  page.on('pageerror', error => errors.push(error.message))

  await page.route('**/*', async (route) => {
    const origin = new URL(url('/')).origin
    const request = route.request()
    const target = new URL(request.url())

    if (target.origin === origin) {
      return route.continue()
    }

    if (target.hostname !== 'capture.mixpanel.test') {
      return route.abort()
    }

    events.push(...decodeEvents(request.url(), request.postData() || ''))

    return route.fulfill({
      status: 200,
      body: '1',
      headers: {
        'access-control-allow-origin': origin,
        'access-control-allow-credentials': 'true',
        'access-control-allow-headers': 'content-type',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'content-type': 'application/json',
      },
    })
  })

  /** Wait until the URL and a rendered `main[data-path]` both match the path. */
  async function waitForRoute(path: string) {
    await page.waitForURL(url(path))
    await page.waitForFunction(() => {
      const current = location.pathname + location.search + location.hash
      return [...document.querySelectorAll('main[data-path]')].some(main => main.getAttribute('data-path') === current)
    })
  }

  function recordedPageviews(): RecordedPageview[] {
    return events.filter(event => event.event === PAGEVIEW_EVENT).map(({ properties = {} }) => {
      const { pathname, search, hash } = new URL(String(properties.$current_url))
      return { path: pathname + search + hash, title: properties.current_page_title, properties }
    })
  }

  async function push(path: string) {
    await page.evaluate(async (target) => {
      await window.__navigate(target)
    }, path)
  }

  return {
    page,
    events,
    errors,
    async open(path = '/one') {
      await page.goto(url(path), { waitUntil: 'hydration' })
      await page.waitForSelector('[data-ready="true"]')
    },
    /** Wait until exactly `expected` pageviews were sent, then check that no late one arrives. */
    async expectPageviews(expected: number, action: string) {
      const count = () => events.filter(event => event.event === PAGEVIEW_EVENT).length

      await expect.poll(count, { message: action }).toBe(expected)

      // Check delayed sends even when the expected count does not change.
      for (let sample = 0; sample < 3; sample++) {
        await sleep(100)
        expect(count(), action).toBe(expected)
      }
    },
    /** Start a client navigation without waiting for the destination to render. */
    push,
    /** Navigate on the client and wait until the destination renders. */
    async navigate(path: string) {
      await push(path)
      await waitForRoute(path)
    },
    /** Pageviews in the order they were sent, with the path and title from the event. */
    recordedPageviews,
    /** Paths of the pageviews in the order they were sent. */
    pageviewPaths: () => recordedPageviews().map(pageview => pageview.path),
    /** Hold same-origin requests matching the pattern until `release()` is called. */
    async holdRequest(pattern: string) {
      const requested = Promise.withResolvers<undefined>()
      const released = Promise.withResolvers<undefined>()

      await page.route(pattern, async (route) => {
        requested.resolve(undefined)
        await released.promise
        await route.fallback()
      })

      return { requested: requested.promise, release: () => released.resolve(undefined) }
    },
    waitForRoute,
  }
}

export type TrackingPage = Awaited<ReturnType<typeof createTrackingPage>>

export const test = base.extend<{ tracking: TrackingPage }>({
  tracking: async ({ task }, use) => {
    const tracking = await createTrackingPage()

    try {
      await use(tracking)
      expect(tracking.errors, task.name).toEqual([])
    }
    finally {
      await tracking.page.context().close()
    }
  },
})
