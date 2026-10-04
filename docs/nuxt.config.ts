import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: ['docus'],
  imports: {
    autoImport: true,
  },
  site: {
    name: 'mixpanel-nuxt',
    url: 'https://mixpanel-nuxt.vercel.app',
  },
  content: {
    experimental: {
      sqliteConnector: 'native',
    },
  },
  routeRules: {
    '/guide/events': { redirect: '/integration/browser' },
    '/guide/identity': { redirect: '/integration/browser#initialization-before-the-first-pageview' },
    '/guide/plugins': { redirect: '/integration/browser#nuxt-plugins' },
    '/guide/ssr': { redirect: '/integration/browser#server-rendering' },
    '/guide/server': { redirect: '/integration/nitro' },
    '/guide/pageviews': { redirect: '/integration/pageviews' },
    '/usage/events': { redirect: '/integration/browser' },
    '/usage/identity': { redirect: '/integration/browser#initialization-before-the-first-pageview' },
    '/usage/pageviews': { redirect: '/integration/pageviews' },
    '/usage/server': { redirect: '/integration/nitro' },
    '/advanced/configuration-files': { redirect: '/get-started/configuration#configuration-files' },
    '/advanced/ssr': { redirect: '/integration/browser#server-rendering' },
    '/advanced/pageview-hook': { redirect: '/api/hooks/pageview' },
    '/api/composables': { redirect: '/api/composables/use-mixpanel' },
    '/api/use-mixpanel': { redirect: '/api/composables/use-mixpanel' },
    '/api/use-mixpanel-server': { redirect: '/api/composables/use-mixpanel-server' },
    '/api/configuration-helpers': { redirect: '/api/utils/define-mixpanel-client-config' },
    '/api/pageview-hook': { redirect: '/api/hooks/pageview' },
  },
  compatibilityDate: '2026-10-06',
  nitro: {
    prerender: {
      failOnError: true,
    },
  },
  llms: {
    contentRawMarkdown: {
      excludeCollections: ['landing'],
    },
  },
})
