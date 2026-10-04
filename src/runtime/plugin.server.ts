import { defineNuxtPlugin } from '#imports'
import { createInactiveClient } from './inactive-client'

export default defineNuxtPlugin({
  name: 'mixpanel',
  setup: () => ({ provide: { mixpanel: createInactiveClient() } }),
})
