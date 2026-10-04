import { defineMixpanelClientConfig } from '../../../src/config'

export default defineMixpanelClientConfig({
  batch_requests: false,
  api_host: 'https://capture.mixpanel.test',
  api_payload_format: 'json',
  autocapture: { block_url_regexes: [/\/two$/] },
})
