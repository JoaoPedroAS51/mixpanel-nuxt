import type { MixpanelClientConfig, MixpanelServerConfig } from './runtime/types'
import { assertConfigObject } from './runtime/config'

export type {
  MixpanelClientConfig,
  MixpanelServerConfig,
  MixpanelClient,
  MixpanelServer,
  MixpanelPageMeta,
  MixpanelPageviewContext,
  ModuleOptions,
  PageviewStrategy,
} from './runtime/types'

/** Define the browser SDK's runtime options. */
export function defineMixpanelClientConfig<T extends MixpanelClientConfig>(config: T): T {
  assertConfigObject(config, 'client config')
  return config
}

/** Define the Node SDK's runtime options. */
export function defineMixpanelServerConfig<T extends MixpanelServerConfig>(config: T): T {
  assertConfigObject(config, 'server config')
  return config
}
