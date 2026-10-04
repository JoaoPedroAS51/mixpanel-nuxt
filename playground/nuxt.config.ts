import { createResolver } from '@nuxt/kit'
import Mixpanel from '../src/module'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: [Mixpanel],
  nitro: {
    typescript: {
      tsConfig: {
        include: [resolve('../src/runtime/server/**/*.ts')],
      },
    },
  },
  typescript: {
    tsConfig: {
      include: [resolve('../test/unit/plugins.test.ts')],
    },
    nodeTsConfig: {
      include: [
        resolve('../vitest.config.ts'),
        resolve('../test/unit/**/*.ts'),
        resolve('../test/e2e/**/*.ts'),
        resolve('../test/support/**/*.ts'),
      ],
      exclude: [resolve('../test/unit/plugins.test.ts')],
    },
  },
  mixpanel: {
    client: {
      enabled: true,
      token: 'client-build-token-marker',
      config: {
        debug: true,
      },
    },
    server: {
      enabled: true,
      token: 'server-build-token-marker',
      config: {
        debug: true,
      },
    },
  },
})
