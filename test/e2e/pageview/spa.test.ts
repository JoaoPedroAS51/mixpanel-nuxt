import { setup, url } from '@nuxt/test-utils/e2e'
import { describe, expect } from 'vitest'
import { test } from '../../support/browser'
import { browserConfig, fixtureOptions } from '../../support/options'

await setup({ ...fixtureOptions('basic', { ...browserConfig, ssr: false }), browser: true })

describe('router pageviews in SPA', () => {
  test('records SPA pageviews, history and reload', async ({ tracking }) => {
    await tracking.open()
    await tracking.page.getByRole('link', { name: 'Next page' }).click()
    await tracking.waitForRoute('/two')
    await tracking.page.goBack()
    await tracking.waitForRoute('/one')
    await tracking.page.reload()
    await tracking.page.waitForSelector('[data-ready="true"]')
    await tracking.expectPageviews(4, 'SPA mount, navigation, history and reload')

    expect(tracking.pageviewPaths()).toEqual(['/one', '/two', '/one', '/one'])
  })

  test('records only the destination of a redirect on the first SPA load', async ({ tracking }) => {
    await tracking.page.goto(url('/redirect'))
    await tracking.waitForRoute('/one')
    await tracking.expectPageviews(1, 'first load redirected by middleware')

    expect(tracking.pageviewPaths()).toEqual(['/one'])
  })
})
