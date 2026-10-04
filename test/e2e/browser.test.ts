import { $fetch, setup, startServer, useTestContext } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect } from 'vitest'
import { test } from '../support/browser'
import { fixtureOptions, runtimeEnv } from '../support/options'

await setup({ ...fixtureOptions(), browser: true })

beforeEach(async () => {
  await startServer({ env: runtimeEnv })
})

describe('browser SDK with SSR', () => {
  test('renders without sending browser events and hydrates once', async ({ tracking }) => {
    const html = await $fetch<string>('/one')

    expect(html).toContain('data-ready="false"')
    expect(html).not.toContain('server-secret-marker')

    await tracking.open()
    await tracking.expectPageviews(1, 'initial hydration')

    expect(tracking.events.filter(event => event.event === 'setup_event')).toHaveLength(1)
    expect(tracking.errors).toEqual([])
  })

  test('tracks interactions and preserves native callbacks', async ({ tracking }) => {
    await tracking.open()
    await tracking.page.getByRole('button', { name: 'Track event' }).click()

    await expect.poll(() => tracking.events.filter(event => event.event === 'click_event')).toHaveLength(1)

    const response = await tracking.page.evaluate(() => new Promise((resolve) => {
      window.__sdk.track('callback_event', {}, { send_immediately: true }, resolve)
    }))

    expect(response).toBe(1)
    expect(tracking.errors).toEqual([])
  })

  test.for([
    { name: 'disabled', env: { NUXT_PUBLIC_MIXPANEL_CLIENT_ENABLED: 'false' } },
  ])('provides an inactive API when $name', async ({ env }, { tracking }) => {
    await startServer({ env: { ...runtimeEnv, ...env } })
    await tracking.open()
    await tracking.page.getByRole('button', { name: 'Track event' }).click()
    await tracking.page.getByRole('link', { name: 'Next page' }).click()
    await tracking.waitForRoute('/two')
    await tracking.expectPageviews(0, 'inactive navigation')

    const state = await tracking.page.evaluate(async () => {
      window.__sdk.people.set({ plan: 'ignored' })
      window.__sdk.get_group('org', 'one').set({ plan: 'ignored' }).union('tags', ['test'])
      return {
        identity: window.__sdk.get_distinct_id(),
        flags: await window.__sdk.flags.get_all_variants(),
      }
    })

    expect(state).toEqual({ identity: undefined, flags: undefined })
    expect(tracking.events).toEqual([])
    expect(tracking.errors).toEqual([])
  })

  test('initializes and tracks with an empty browser token', async ({ tracking }) => {
    await startServer({ env: { ...runtimeEnv, NUXT_PUBLIC_MIXPANEL_CLIENT_TOKEN: '' } })
    await tracking.open()
    await tracking.expectPageviews(1, 'empty token initialization')

    const identity = await tracking.page.evaluate(() => window.__sdk.get_distinct_id())

    expect(identity).toEqual(expect.any(String))
    expect(tracking.events[0]).toMatchObject({ properties: { token: '' } })
    expect(tracking.errors).toEqual([])
  })

  test('builds with an empty token and accepts it at deployment', () => {
    const config = useTestContext().nuxt!.options.runtimeConfig

    expect(config.public.mixpanel.client.token).toBe('')
  })
})
