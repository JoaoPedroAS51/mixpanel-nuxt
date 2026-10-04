import NodeMixpanel from 'mixpanel'
import { describe, expectTypeOf, it } from 'vitest'
import { defineMixpanelClientConfig, defineMixpanelServerConfig } from '../../src/config'
import type { ClientOptions, MixpanelClient, ServerOptions } from '../../src/runtime/types'

describe('configuration helpers', () => {
  it('passes the browser SDK to the loaded callback', () => {
    defineMixpanelClientConfig({
      loaded(sdk) {
        expectTypeOf(sdk).not.toBeAny()
        expectTypeOf(sdk.track).parameter(0).toEqualTypeOf<string>()
      },
      track_pageview: true,
    })
  })

  it('accepts Node SDK credentials', () => {
    defineMixpanelServerConfig({
      credentials: new NodeMixpanel.ServiceAccountCredentials('name', 'secret', 'project'),
    })
  })

  it('rejects factories', () => {
    // @ts-expect-error factories are not configuration objects
    defineMixpanelClientConfig(() => ({ debug: true }))
  })

  it('rejects options of the other SDK', () => {
    // @ts-expect-error browser config has no server host option
    defineMixpanelClientConfig({ host: 'api.mixpanel.com' })

    // @ts-expect-error server config has no browser persistence option
    defineMixpanelServerConfig({ persistence: 'localStorage' })
  })
})

describe('module options', () => {
  it('accepts helper output as inline server config', () => {
    expectTypeOf({ config: defineMixpanelServerConfig({ geolocate: false }) }).toExtend<ServerOptions>()
  })

  it('keeps Node SDK property types in inline server config', () => {
    expectTypeOf<{ config: { keepAlive: string } }>().not.toExtend<ServerOptions>()
  })

  it('requires a configuration file for callbacks', () => {
    expectTypeOf<{ config: { loaded: (sdk: MixpanelClient) => void } }>().not.toExtend<ClientOptions>()
  })

  it('accepts one configuration source', () => {
    expectTypeOf<{ config: object, configFile: string }>().not.toExtend<ClientOptions>()
  })

  it('accepts router or native as pageview strategy', () => {
    expectTypeOf<NonNullable<ClientOptions['pageviewStrategy']>>().toEqualTypeOf<'router' | 'native'>()
  })
})
