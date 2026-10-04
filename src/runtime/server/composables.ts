import { useRuntimeConfig } from 'nuxt/server'
import sdk from 'mixpanel'
import fileConfig from '#mixpanel/server-config'
import { createServerAccessor } from './client'
import type { MixpanelServer, ServerRuntimeOptions } from '../types'

/** Access the shared Node SDK. Identity must be supplied with each operation. */
export const useMixpanelServer: () => MixpanelServer = createServerAccessor(
  () => useRuntimeConfig().mixpanel.server as ServerRuntimeOptions,
  sdk,
  fileConfig,
)
