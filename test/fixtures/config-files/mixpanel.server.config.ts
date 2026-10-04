import { defineMixpanelServerConfig } from '../../../src/config'

export default defineMixpanelServerConfig({
  host: '127.0.0.1',
  protocol: 'http',
  port: Number(process.env.TEST_MIXPANEL_COLLECTOR_PORT),
  geolocate: false,
  path: '/server-config-private-marker',
  logger: {
    trace() {},
    debug() {},
    info() {},
    warn() {},
    error() {},
  },
})
