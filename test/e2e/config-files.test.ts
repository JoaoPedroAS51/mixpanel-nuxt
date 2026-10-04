import { $fetch, createPage, createTest, url } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import { fixtureOptions } from '../support/options'

const cases = ['client', 'server'].flatMap(section => [
  { section, name: 'undefined', file: 'undefined.ts' },
  { section, name: 'factory', file: 'factory.ts' },
])

describe('invalid configuration file exports', () => {
  test.each(cases)('$section rejects $name through its generated template', async ({ section, file }) => {
    const lifecycle = createTest({
      ...fixtureOptions('basic', {
        mixpanel: {
          client: { enabled: false },
          [section]: { enabled: true, configFile: `./configurations/${file}` },
        },
      }),
      browser: section === 'client',
    })
    const expected = `${section}.configFile default export must be a plain configuration object`

    try {
      await lifecycle.beforeAll()

      if (section === 'server') {
        await expect($fetch('/api/sdk', { retry: 0 })).rejects.toMatchObject({ statusCode: 500 })
        await expect.poll(() => $fetch<string[]>('/api/errors')).toEqual(
          expect.arrayContaining([expect.stringContaining(expected)]),
        )
      }
      else {
        const page = await createPage()
        const origin = new URL(url('/')).origin

        await page.route('**/*', (route) => {
          return new URL(route.request().url()).origin === origin ? route.continue() : route.abort()
        })
        await page.goto(url('/one'))

        await expect.poll(() => page.evaluate(() => window.__mixpanelErrors || [])).toEqual(
          expect.arrayContaining([expect.stringContaining(expected)]),
        )
      }
    }
    finally {
      await lifecycle.afterAll()
    }
  })

  test.each(['client', 'server'])('%s rejects a missing default export during build', async (section) => {
    const lifecycle = createTest({
      ...fixtureOptions('basic', {
        mixpanel: {
          client: { enabled: false },
          [section]: { enabled: true, configFile: './configurations/missing-default.ts' },
        },
      }),
      server: false,
      build: true,
    })

    try {
      await expect(lifecycle.beforeAll()).rejects.toThrow(/default.*not exported|No matching export.*default/)
    }
    finally {
      await lifecycle.afterAll()
    }
  })
})
