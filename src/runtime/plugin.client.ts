import { defineNuxtPlugin } from '#imports'
import { createInactiveClient } from './inactive-client'
import { resolvePageviewStrategy, resolveSDKConfig } from './config'
import { resolvePageviewMode, withoutSDKPageviews } from './pageview/config'
import type { ClientRuntimeOptions, MixpanelClient, MixpanelClientConfig } from './types'

export default defineNuxtPlugin({
  name: 'mixpanel',
  async setup(nuxtApp) {
    const options = nuxtApp.$config.public.mixpanel.client as ClientRuntimeOptions
    let client: MixpanelClient = createInactiveClient()
    if (options.enabled) {
      const { default: fileConfig } = await import('#mixpanel/client-config')
      const config = resolveSDKConfig<MixpanelClientConfig>(options.config, fileConfig, 'client')
      const routerPageviewMode = resolvePageviewStrategy(options.pageviewStrategy) === 'router' && resolvePageviewMode(config)
      const { default: sdk } = await import('mixpanel-browser')
      const native = sdk.init(options.token, routerPageviewMode ? withoutSDKPageviews(config) : config, 'mixpanel-nuxt')

      if (routerPageviewMode) {
        const { trackRouterPageviews } = await import('./pageview/router')
        nuxtApp.runWithContext(() => trackRouterPageviews(native, config, routerPageviewMode))
      }

      client = native
    }
    return { provide: { mixpanel: client } }
  },
})
