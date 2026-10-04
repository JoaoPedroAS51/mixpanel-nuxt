import { setup } from '@nuxt/test-utils/e2e'
import { describe, expect } from 'vitest'
import { test } from '../../support/browser'
import { fixtureOptions } from '../../support/options'

await setup({ ...fixtureOptions('no-pages', {}), browser: true })

describe('router pageviews without pages/', () => {
  test('records the initial visit with hook properties and without route_name', async ({ tracking }) => {
    await tracking.open('/first')
    await tracking.expectPageviews(1, 'initial visit')

    const [pageview] = tracking.recordedPageviews()
    expect(pageview).toMatchObject({ path: '/first', title: 'First page', properties: { hook_path: '/first' } })
    expect(pageview?.properties).not.toHaveProperty('route_name')
  })

  test('records link navigation and history with the title of each route', async ({ tracking }) => {
    await tracking.open('/first')
    await tracking.page.getByRole('link', { name: 'Second page' }).click()
    await tracking.waitForRoute('/second')
    await tracking.expectPageviews(2, 'link navigation')

    await tracking.page.goBack()
    await tracking.waitForRoute('/first')
    await tracking.expectPageviews(3, 'back')

    await tracking.page.goForward()
    await tracking.waitForRoute('/second')
    await tracking.expectPageviews(4, 'forward')

    expect(tracking.recordedPageviews().map(({ path, title }) => [path, title])).toEqual([
      ['/first', 'First page'],
      ['/second', 'Second page'],
      ['/first', 'First page'],
      ['/second', 'Second page'],
    ])
  })

  test('records nothing when middleware cancels a navigation', async ({ tracking }) => {
    await tracking.open('/first')
    await tracking.push('/blocked')
    await tracking.expectPageviews(1, 'cancelled navigation')

    expect(new URL(tracking.page.url()).pathname).toBe('/first')
  })

  test('records only the final destination of a middleware redirect', async ({ tracking }) => {
    await tracking.open('/second')
    await tracking.push('/redirect')
    await tracking.waitForRoute('/first')
    await tracking.expectPageviews(2, 'redirect')

    expect(tracking.pageviewPaths()).toEqual(['/second', '/first'])
  })

  test('records nothing when middleware cancels a back navigation, which leaves the URL on the cancelled route', async ({ tracking }) => {
    await tracking.open('/first')
    await tracking.push('/second')
    await tracking.waitForRoute('/second')
    await tracking.page.evaluate(() => {
      window.__noPages.blocked = '/first'
    })
    await tracking.page.goBack()
    await tracking.page.waitForURL('**/first')
    await tracking.expectPageviews(2, 'cancelled back navigation')

    expect(await tracking.page.locator('main').getAttribute('data-path')).toBe('/second')
  })
})
