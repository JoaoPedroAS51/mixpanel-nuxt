import { setup, startServer } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect } from 'vitest'
import { test } from '../../support/browser'
import { fixtureOptions, runtimeEnv } from '../../support/options'

await setup({ ...fixtureOptions('url-filters', {}), browser: true })

beforeEach(async () => {
  await startServer({ env: runtimeEnv })
})

describe('router pageviews with autocapture URL filters', () => {
  test('records nothing for a URL matched by block_url_regexes', async ({ tracking }) => {
    await tracking.open('/one')
    await tracking.navigate('/two')
    await tracking.navigate('/three')
    await tracking.expectPageviews(2, 'blocked URL between two pages')

    expect(tracking.pageviewPaths()).toEqual(['/one', '/three'])
  })
})
