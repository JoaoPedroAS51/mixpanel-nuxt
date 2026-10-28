import { join } from 'node:path'
import { loadNuxt } from '@nuxt/kit'
import { assert, describe, expect, test } from 'vitest'
import { fixturePath } from '../support/options'

const rootDir = fixturePath('basic')
const configFilesDir = fixturePath('config-files')

async function configurationTemplate(nuxt: Awaited<ReturnType<typeof loadNuxt>>, section: 'client' | 'server') {
  if (section === 'client') {
    const template = nuxt.options.build.templates.find(template => template.filename === 'mixpanel/client-config.mjs')
    assert(template?.getContents)
    expect(nuxt.options.alias['#mixpanel/client-config']).toBe(template.dst)

    return template.getContents({} as never)
  }

  const template = nuxt.options.nitro.virtual?.['#mixpanel/server-config']
  assert(typeof template === 'function')

  return template()
}

const cases = [
  ...['client', 'server'].flatMap(section => [
    {
      name: `${section}: inline and file configuration together`,
      options: { config: {}, configFile: './configurations/valid.ts' },
      expected: `${section}: config and configFile are mutually exclusive`,
      section,
    },
    {
      name: `${section}: missing configuration file`,
      options: { configFile: './missing.ts' },
      expected: `${section}.configFile does not exist`,
      section,
    },
    {
      name: `${section}: non-serializable nested value`,
      options: { config: { nested: { value: () => {} } } },
      expected: `${section}.config.nested.value`,
      section,
    },
  ]),
  {
    name: 'client: unknown pageview strategy',
    options: { pageviewStrategy: 'browser' },
    expected: 'client.pageviewStrategy must be \'router\' or \'native\'',
    section: 'client',
  },
]

describe('module configuration validation', () => {
  test.each(cases)('$name', async ({ section, options, expected }) => {
    let nuxt: Awaited<ReturnType<typeof loadNuxt>> | undefined

    try {
      await expect(async () => {
        nuxt = await loadNuxt({
          cwd: rootDir,
          dev: false,
          dotenv: false,
          overrides: { mixpanel: { [section]: options } },
        })
      }).rejects.toThrow(expected)
    }
    finally {
      await nuxt?.close()
    }
  })
})

describe('runtime configuration', () => {
  test('enables server access by default without a token', async () => {
    const nuxt = await loadNuxt({ cwd: rootDir, dev: false, dotenv: false })

    try {
      expect(nuxt.options.runtimeConfig.mixpanel.server.enabled).toBe(true)
      expect(nuxt.options.runtimeConfig.mixpanel.server.token).toBe('')
    }
    finally {
      await nuxt.close()
    }
  })

  test.each(['client', 'server'] as const)('%s runtime values take precedence over module options', async (section) => {
    const runtimeOptions = {
      enabled: false,
      token: 'runtime-token',
      config: { debug: false },
      ...(section === 'client' && { pageviewStrategy: 'native' as const }),
    }
    const runtimeConfig = section === 'client'
      ? { public: { mixpanel: { client: runtimeOptions } } }
      : { mixpanel: { server: runtimeOptions } }
    const nuxt = await loadNuxt({
      cwd: rootDir,
      dev: false,
      dotenv: false,
      overrides: {
        mixpanel: { [section]: { enabled: true, token: 'module-token', config: { debug: true } } },
        runtimeConfig,
      },
    })

    try {
      const actual = section === 'client'
        ? nuxt.options.runtimeConfig.public.mixpanel.client
        : nuxt.options.runtimeConfig.mixpanel.server

      expect(actual).toEqual(runtimeOptions)
    }
    finally {
      await nuxt.close()
    }
  })

  test.each(['client', 'server'] as const)('%s retains module options omitted from runtime config', async (section) => {
    const runtimeOptions = { token: 'runtime-token' }
    const runtimeConfig = section === 'client'
      ? { public: { mixpanel: { client: runtimeOptions } } }
      : { mixpanel: { server: runtimeOptions } }
    const nuxt = await loadNuxt({
      cwd: rootDir,
      dev: false,
      dotenv: false,
      overrides: {
        mixpanel: { [section]: { enabled: true, token: 'module-token', config: { debug: true } } },
        runtimeConfig,
      },
    })

    try {
      const actual = section === 'client'
        ? nuxt.options.runtimeConfig.public.mixpanel.client
        : nuxt.options.runtimeConfig.mixpanel.server

      expect(actual).toEqual({
        enabled: true,
        token: 'runtime-token',
        config: { debug: true },
        ...(section === 'client' && { pageviewStrategy: 'router' }),
      })
    }
    finally {
      await nuxt.close()
    }
  })

  test.each(['client', 'server'] as const)('%s rejects runtime config alongside a configuration file', async (section) => {
    const runtimeOptions = { config: {} }
    const runtimeConfig = section === 'client'
      ? { public: { mixpanel: { client: runtimeOptions } } }
      : { mixpanel: { server: runtimeOptions } }
    let nuxt: Awaited<ReturnType<typeof loadNuxt>> | undefined

    try {
      await expect(async () => {
        nuxt = await loadNuxt({
          cwd: rootDir,
          dev: false,
          dotenv: false,
          overrides: {
            mixpanel: { [section]: { configFile: './configurations/valid.ts' } },
            runtimeConfig,
          },
        })
      }).rejects.toThrow(`${section}: runtimeConfig config and configFile are mutually exclusive`)
    }
    finally {
      await nuxt?.close()
    }
  })
})

describe('configuration file discovery', () => {
  test.each(['client', 'server'] as const)('%s discovers its configuration file in the project root', async (section) => {
    const path = join(configFilesDir, `mixpanel.${section}.config.ts`)
    let nuxt: Awaited<ReturnType<typeof loadNuxt>> | undefined

    try {
      nuxt = await loadNuxt({ cwd: configFilesDir, dev: false, dotenv: false })
      const options = section === 'client'
        ? nuxt.options.runtimeConfig.public.mixpanel.client
        : nuxt.options.runtimeConfig.mixpanel.server
      const references: Array<{ path: string }> = []

      if (section === 'client') {
        await nuxt.callHook('prepare:types', {
          references,
          declarations: [],
          tsConfig: {},
          nodeReferences: [],
          sharedReferences: [],
          nodeTsConfig: {},
          sharedTsConfig: {},
          serverReferences: [],
          serverTsConfig: {},
        })
      }
      else {
        await nuxt.callHook('nitro:prepare:types', { references, declarations: [] })
      }

      expect(options.config).toBeUndefined()
      expect(references).toContainEqual({ path })
      expect(await configurationTemplate(nuxt, section)).toContain(`import config from ${JSON.stringify(path)}`)
    }
    finally {
      await nuxt?.close()
    }
  })

  test.each(['client', 'server'] as const)('%s uses an explicit path instead of the default file', async (section) => {
    const path = join(configFilesDir, `mixpanel.${section}.config.ts`)
    let nuxt: Awaited<ReturnType<typeof loadNuxt>> | undefined

    try {
      nuxt = await loadNuxt({
        cwd: configFilesDir,
        dev: false,
        dotenv: false,
        overrides: { mixpanel: { [section]: { configFile: '../basic/configurations/valid.ts' } } },
      })
      const references: Array<{ path: string }> = []

      if (section === 'client') {
        await nuxt.callHook('prepare:types', {
          references,
          declarations: [],
          tsConfig: {},
          nodeReferences: [],
          sharedReferences: [],
          nodeTsConfig: {},
          sharedTsConfig: {},
          serverReferences: [],
          serverTsConfig: {},
        })
      }
      else {
        await nuxt.callHook('nitro:prepare:types', { references, declarations: [] })
      }

      expect(references).toContainEqual({ path: join(rootDir, 'configurations/valid.ts') })
      expect(references).not.toContainEqual({ path })
      const contents = await configurationTemplate(nuxt, section)
      expect(contents).toContain(`import config from ${JSON.stringify(join(rootDir, 'configurations/valid.ts'))}`)
      expect(contents).not.toContain(JSON.stringify(path))
    }
    finally {
      await nuxt?.close()
    }
  })

  test.each(['client', 'server'].flatMap(section => ['module', 'runtime'].map(source => ({ section, source }))))(
    '$section rejects $source inline config alongside a discovered file',
    async ({ section, source }) => {
      const runtimeConfig = section === 'client'
        ? { public: { mixpanel: { client: { config: {} } } } }
        : { mixpanel: { server: { config: {} } } }
      let nuxt: Awaited<ReturnType<typeof loadNuxt>> | undefined

      try {
        await expect(async () => {
          nuxt = await loadNuxt({
            cwd: configFilesDir,
            dev: false,
            dotenv: false,
            overrides: source === 'module'
              ? { mixpanel: { [section]: { config: {} } } }
              : { runtimeConfig },
          })
        }).rejects.toThrow(/config and configFile are mutually exclusive/)
      }
      finally {
        await nuxt?.close()
      }
    },
  )
})
