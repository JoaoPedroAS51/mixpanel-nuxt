export default defineNuxtConfig({
  modules: ['mixpanel-nuxt'],
  devtools: { enabled: false },
  compatibilityDate: '2026-10-03',
  telemetry: false,
  mixpanel: {
    client: {
      config: {
        batch_requests: false,
        api_host: 'https://capture.mixpanel.test',
        api_payload_format: 'json',
        track_pageview: 'url-with-path',
      },
    },
  },
})
