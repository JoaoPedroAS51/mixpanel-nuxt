import { defineMixpanelClientConfig } from '../../../src/config'

if (typeof window === 'undefined') {
  throw new TypeError('client config executed in SSR')
}

export default defineMixpanelClientConfig({
  batch_requests: false,
  api_host: 'https://capture.mixpanel.test',
  api_payload_format: 'json',
  track_pageview: 'url-with-path',
  autocapture: false,
  record_block_class: /private/,
  loaded() {
    window.__mixpanelLoaded = (window.__mixpanelLoaded || 0) + 1
  },
})
