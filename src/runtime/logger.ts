import { createConsola, LogLevels } from 'consola'

export const LOG_PREFIX = 'mixpanel-nuxt'

export const logger = createConsola().withTag(LOG_PREFIX)

export function createDebugLogger() {
  return logger.create({ level: LogLevels.debug })
}
