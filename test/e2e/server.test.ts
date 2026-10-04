import { $fetch, setup, startServer, useTestContext } from '@nuxt/test-utils/e2e'
import { afterAll, beforeEach, describe, expect } from 'vitest'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { createCollector } from '../support/events'
import { fixtureOptions, runtimeEnv } from '../support/options'
import { test } from '../support/browser'

interface ServerResponse {
  same?: boolean
  instanceId?: string
  error?: string
}

const collector = await createCollector()
const env = { ...runtimeEnv, TEST_MIXPANEL_COLLECTOR_PORT: String(collector.port) }

afterAll(() => collector.close())

await setup({
  ...fixtureOptions('config-files', { mixpanel: { server: { token: 'server-build-token-marker' } } }),
  env,
  browser: true,
})

beforeEach(async () => {
  collector.events.length = 0
  await startServer({ env })
})

describe('Node SDK in Nitro', () => {
  test('does not forward SSR or browser operations to the Node SDK', async ({ tracking }) => {
    const html = await $fetch<string>('/one')

    expect(html).toContain('data-ready="false"')
    await sleep(300)
    expect(collector.events).toEqual([])

    await tracking.open()
    await tracking.expectPageviews(1, 'client configuration file')

    expect(await tracking.page.evaluate(() => window.__mixpanelLoaded)).toBe(1)

    await tracking.page.getByRole('link', { name: 'Next page' }).click()
    await tracking.waitForRoute('/two')
    await tracking.expectPageviews(2, 'navigation with configuration file')

    await tracking.page.reload()
    await tracking.page.waitForSelector('[data-ready="true"]')
    await tracking.expectPageviews(3, 'configuration file after reload')

    expect(await tracking.page.evaluate(() => window.__mixpanelLoaded)).toBe(1)
    expect(collector.events).toEqual([])
    expect(tracking.errors).toEqual([])
  })

  test('reuses one native instance across requests with explicit identities', async () => {
    const responses = await Promise.all([
      $fetch<ServerResponse>('/api/sdk?id=first'),
      $fetch<ServerResponse>('/api/sdk?id=second'),
    ])

    expect(responses.every(response => response.same && !response.error)).toBe(true)
    expect(responses[0]!.instanceId).toEqual(expect.any(String))
    expect(responses[1]!.instanceId).toBe(responses[0]!.instanceId)
    expect(collector.events.map(event => event.properties?.distinct_id).sort()).toEqual(['first', 'second'])
    expect(collector.events.map(event => event.properties?.token)).toEqual([
      runtimeEnv.NUXT_MIXPANEL_SERVER_TOKEN,
      runtimeEnv.NUXT_MIXPANEL_SERVER_TOKEN,
    ])
  })

  test('preserves SDK callback errors', async () => {
    const response = await $fetch<ServerResponse>('/api/sdk?fail=1')

    expect(response.error).toMatch(/Mixpanel Server Error/)
  })

  test.each([
    { name: 'disabled', env: { NUXT_MIXPANEL_SERVER_ENABLED: 'false' }, error: /Enable mixpanel.server.enabled/ },
    { name: 'missing token', env: { NUXT_MIXPANEL_SERVER_TOKEN: '' }, error: /The Mixpanel Client needs a Mixpanel token/ },
  ])('reports $name independently from the client', async ({ env: overrides, error }) => {
    await startServer({ env: { ...env, ...overrides } })

    const response = await $fetch<ServerResponse>('/api/sdk')

    expect(response.error).toMatch(error)
    expect(collector.events).toEqual([])
  })

  test('keeps private configuration out of HTML and public assets', async () => {
    const html = await $fetch<string>('/one')
    const outputDir = useTestContext().nuxt!.options.nitro.output!.dir!
    const publicDir = join(outputDir, 'public')
    const files = await readdir(publicDir, { recursive: true })
    const markers = ['server-secret-marker', 'server-build-token-marker', 'server-config-private-marker']

    for (const marker of markers) {
      expect(html).not.toContain(marker)
    }
    expect(html).not.toContain('mixpanel.server.config')

    for (const file of files.filter(file => /\.(?:js|json|html)$/.test(file))) {
      const content = await readFile(join(publicDir, file), 'utf8')

      for (const marker of markers) {
        expect(content, file).not.toContain(marker)
      }
      expect(content, file).not.toContain('mixpanel-node')
      expect(content, file).not.toContain('mixpanel.server.config')
    }

    const serverDir = join(outputDir, 'server')
    const serverFiles = await readdir(serverDir, { recursive: true })
    const serverContents = await Promise.all(serverFiles
      .filter(file => /\.(?:m?js|json)$/.test(file))
      .map(file => readFile(join(serverDir, file), 'utf8')))

    expect(serverContents.some(content => content.includes('server-build-token-marker'))).toBe(true)
    expect(serverContents.some(content => content.includes('server-config-private-marker'))).toBe(true)
  })
})
