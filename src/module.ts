import { existsSync, statSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import {
  addImports,
  addPlugin,
  addServerImports,
  addServerTemplate,
  addTemplate,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
  directoryToURL,
  resolveModule,
} from '@nuxt/kit'
import { defu } from 'defu'
import { assertConfigObject, assertPageviewStrategy, assertSerializable } from './runtime/config'
import { LOG_PREFIX } from './runtime/logger'
import type { ModuleOptions, ModuleRuntimeConfig, ModulePublicRuntimeConfig } from './runtime/types'

export type { ModuleOptions, ModulePublicRuntimeConfig, ModuleRuntimeConfig } from './runtime/types'

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    mixpanel: ModuleRuntimeConfig['mixpanel']
  }

  interface PublicRuntimeConfig {
    mixpanel: ModulePublicRuntimeConfig['mixpanel']
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'mixpanel-nuxt',
    configKey: 'mixpanel',
    compatibility: { nuxt: '>=4.6.0' },
  },
  defaults: {
    client: { enabled: true, token: '', pageviewStrategy: 'router' },
    server: { enabled: true, token: '' },
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const paths: Partial<Record<'client' | 'server', string>> = {}

    // Configuration sources

    for (const section of ['client', 'server'] as const) {
      const value = options[section]

      const configFile = value.configFile ?? `mixpanel.${section}.config.ts`
      const path = resolvePath(nuxt.options.rootDir, configFile)
      const hasFile = existsSync(path) && statSync(path).isFile()

      if (value.config !== undefined && (value.configFile !== undefined || hasFile)) {
        throw new Error(`[${LOG_PREFIX}] ${section}: config and configFile are mutually exclusive.`)
      }

      if (value.configFile !== undefined && !hasFile) {
        throw new Error(`[${LOG_PREFIX}] ${section}.configFile does not exist: ${value.configFile}`)
      }

      if (value.config !== undefined) {
        assertConfigObject(value.config, `${section}.config`)
        assertSerializable(value.config, `${section}.config`)
      }

      if (hasFile) {
        paths[section] = path
      }
    }

    // Runtime configuration

    const publicRuntimeConfig = nuxt.options.runtimeConfig.public as ModulePublicRuntimeConfig
    const runtimeConfig: ModuleRuntimeConfig = nuxt.options.runtimeConfig

    const client = defu(publicRuntimeConfig.mixpanel?.client, {
      enabled: options.client.enabled ?? true,
      token: options.client.token ?? '',
      pageviewStrategy: options.client.pageviewStrategy ?? 'router',
    })
    const server = defu(runtimeConfig.mixpanel?.server, {
      enabled: options.server.enabled ?? true,
      token: options.server.token ?? '',
    })

    if (!paths.client) {
      client.config ??= options.client.config ?? {}
    }

    if (!paths.server) {
      server.config ??= options.server.config ?? {}
    }

    for (const [section, value] of Object.entries({ client, server })) {
      if (paths[section as 'client' | 'server'] && value.config !== undefined) {
        throw new Error(`[${LOG_PREFIX}] ${section}: runtimeConfig config and configFile are mutually exclusive.`)
      }

      assertSerializable(value, `runtimeConfig.mixpanel.${section}`)
    }

    assertPageviewStrategy(client.pageviewStrategy, 'client.pageviewStrategy')

    publicRuntimeConfig.mixpanel = { client }
    runtimeConfig.mixpanel = { server }

    // Configuration file types

    if (paths.client) {
      nuxt.hook('prepare:types', ({ references }) => {
        references.push({ path: paths.client! })
      })
    }

    if (paths.server) {
      nuxt.hook('nitro:prepare:types', ({ references }) => {
        references.push({ path: paths.server! })
      })
    }

    // SDK configuration templates

    const configValidatorPath = resolve('./runtime/config')

    const clientTemplate = addTemplate({
      filename: 'mixpanel/client-config.mjs',
      write: true,
      dependsOn: [],
      getContents: () => generateConfigTemplate('client', paths.client, configValidatorPath),
    })
    nuxt.options.alias['#mixpanel/client-config'] = clientTemplate.dst

    for (const [filename, contents] of Object.entries({
      '#mixpanel/server-config': generateConfigTemplate('server', paths.server, configValidatorPath),
      '#mixpanel/server': `export { useMixpanelServer } from ${JSON.stringify(resolve('./runtime/server/composables'))}`,
    })) {
      addServerTemplate({ filename, getContents: () => contents })
    }

    // Router pageviews

    // Pageviews must render the head with the Unhead copy of the Nuxt instance running the build.
    nuxt.options.alias['#mixpanel/unhead-client'] = resolveModule('@unhead/vue/client', {
      url: directoryToURL(nuxt.options.appDir),
    })

    // Application APIs

    addPlugin({ src: resolve('./runtime/plugin.client'), mode: 'client' })
    addPlugin({ src: resolve('./runtime/plugin.server'), mode: 'server' })
    addImports({ name: 'useMixpanel', from: resolve('./runtime/composables') })
    addServerImports({ name: 'useMixpanelServer', from: '#mixpanel/server' })

    // API declarations

    const runtimeTypes = JSON.stringify(resolve('./runtime/types'))

    addTypeTemplate({
      filename: 'types/mixpanel.client-config.d.ts',
      dependsOn: [],
      getContents: () => generateClientConfigType(),
    }, { nuxt: true })
    addTypeTemplate({
      filename: 'types/mixpanel.router.d.ts',
      dependsOn: [],
      getContents: () => generateRouterTypes(),
    }, { nuxt: true })
    addTypeTemplate({
      filename: 'types/mixpanel.nitro.d.ts',
      dependsOn: [],
      getContents: () => generateNitroTypes(),
    }, { nuxt: false, nitro: true })
    addTypeTemplate({
      filename: 'types/mixpanel.server-api.d.ts',
      dependsOn: [],
      getContents: () => generateServerApiType(runtimeTypes),
    }, { nuxt: true, nitro: true })
    addTypeTemplate({
      filename: 'types/mixpanel.d.ts',
      dependsOn: [],
      getContents: () => generateAppTypes(runtimeTypes),
    })
  },
})

function generateConfigTemplate(
  section: 'client' | 'server',
  configPath: string | undefined,
  validatorPath: string,
) {
  if (!configPath) {
    return 'export default undefined'
  }

  return `
import config from ${JSON.stringify(configPath)}
import { assertConfigObject } from ${JSON.stringify(validatorPath)}

assertConfigObject(config, '${section}.configFile default export')

export default config
`
}

function generateClientConfigType() {
  return `
declare module "#mixpanel/client-config" {
  const config: unknown
  export default config
}
`
}

function generateRouterTypes() {
  return `
declare module "#mixpanel/unhead-client" {
  export function renderDOMHead(head: unknown): boolean
}
`
}

function generateNitroTypes() {
  return `
declare module "#mixpanel/server-config" {
  const config: unknown
  export default config
}
`
}

function generateServerApiType(runtimeTypes: string) {
  return `
declare module "#mixpanel/server" {
  export function useMixpanelServer(): import(${runtimeTypes}).MixpanelServer
}
`
}

function generateAppTypes(runtimeTypes: string) {
  return `
import type { MixpanelClient, MixpanelPageMeta, MixpanelPageviewContext } from ${runtimeTypes}
import type { RouteLocationNormalized } from "#vue-router"

declare module "nuxt/app" {
  interface NuxtApp {
    $mixpanel: MixpanelClient
  }

  interface PageMeta {
    mixpanel?: MixpanelPageMeta
  }

  interface RuntimeNuxtHooks {
    "mixpanel:pageview": (context: MixpanelPageviewContext<RouteLocationNormalized>) => void | Promise<void>
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $mixpanel: MixpanelClient
  }
}

export {}
`
}
