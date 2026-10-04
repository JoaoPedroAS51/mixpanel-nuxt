import { resolveSDKConfig } from '../config'
import { createDebugLogger, LOG_PREFIX } from '../logger'
import type { MixpanelServer, MixpanelServerConfig, MixpanelServerSDK, ServerRuntimeOptions } from '../types'

export function createServerAccessor(
  getOptions: () => ServerRuntimeOptions,
  sdk: MixpanelServerSDK,
  fileConfig: unknown,
): () => MixpanelServer {
  let client: MixpanelServer | undefined

  return () => {
    const options = getOptions()

    if (!options.enabled) {
      throw new Error(`[${LOG_PREFIX}] Enable mixpanel.server.enabled before calling useMixpanelServer().`)
    }

    if (!client) {
      let config = resolveSDKConfig<MixpanelServerConfig>(options.config, fileConfig, 'server')

      if (config.debug && config.logger === undefined) {
        config = {
          ...config,
          logger: createDebugLogger(),
        }
      }

      client = sdk.init(options.token, config)
    }

    return client
  }
}
