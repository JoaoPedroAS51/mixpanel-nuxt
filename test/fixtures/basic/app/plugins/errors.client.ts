import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin({
  name: 'capture-fixture-errors',
  enforce: 'pre',
  hooks: {
    'app:error'(error) {
      window.__mixpanelErrors ??= []
      window.__mixpanelErrors.push(error.message)
    },
  },
})
