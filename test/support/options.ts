import type { TestOptions } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import type { NuxtConfig } from 'nuxt/schema'

export const runtimeEnv = {
  NUXT_TELEMETRY_DISABLED: '1',
  NUXT_PUBLIC_MIXPANEL_CLIENT_TOKEN: 'browser-fixture-token',
  NUXT_MIXPANEL_SERVER_TOKEN: 'server-secret-marker',
  HTTP_PROXY: '',
  HTTPS_PROXY: '',
}

/** Browser SDK options that send every event to the capture host the tracking page intercepts. */
export const browserConfig = {
  mixpanel: {
    client: {
      config: {
        batch_requests: false,
        api_host: 'https://capture.mixpanel.test',
        api_payload_format: 'json',
        track_pageview: 'url-with-path',
        autocapture: false,
      },
    },
  },
} satisfies NuxtConfig

/** Absolute path of a fixture app in `test/fixtures`. */
export function fixturePath(name: string) {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

/** Build options for a fixture app, using `browserConfig` when no Nuxt config is given. */
export function fixtureOptions(name = 'basic', nuxtConfig: NuxtConfig = browserConfig): Partial<TestOptions> {
  return {
    rootDir: fixturePath(name),
    env: runtimeEnv,
    nuxtConfig,
  }
}
