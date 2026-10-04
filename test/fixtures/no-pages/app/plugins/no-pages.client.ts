import { defineNuxtPlugin, navigateTo } from '#imports'

export default defineNuxtPlugin({
  name: 'no-pages-fixture',
  dependsOn: ['mixpanel'],
  setup(nuxtApp) {
    window.__noPages = {}
    window.__navigate = navigateTo

    nuxtApp.hook('mixpanel:pageview', (context) => {
      context.properties.hook_path = context.route.fullPath
    })
  },
})
