import { LOG_PREFIX, logger } from './logger'
import type { PageviewStrategy } from './types'

const PAGEVIEW_STRATEGIES: readonly PageviewStrategy[] = ['router', 'native']
const PAGEVIEW_STRATEGY_LIST = PAGEVIEW_STRATEGIES.map(strategy => `'${strategy}'`).join(' or ')

export function assertConfigObject(value: unknown, field: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`[${LOG_PREFIX}] ${field} must be a plain configuration object.`)
  }
}

export function assertSerializable(value: unknown, field: string, ancestors = new Set<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return
  }

  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`[${LOG_PREFIX}] ${field} must be JSON-serializable. Use configFile for runtime options.`)
  }
  if (ancestors.has(value)) {
    throw new TypeError(`[${LOG_PREFIX}] ${field} contains a circular reference.`)
  }

  if (!Array.isArray(value)) {
    assertConfigObject(value, field)
  }

  ancestors.add(value)

  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === 'length') {
      continue
    }

    const descriptor = Object.getOwnPropertyDescriptor(value, key)!

    if (typeof key === 'symbol' || descriptor.get || descriptor.set) {
      throw new TypeError(`[${LOG_PREFIX}] ${field}.${String(key)} must be a JSON data property.`)
    }

    assertSerializable(descriptor.value, `${field}.${String(key)}`, ancestors)
  }

  ancestors.delete(value)
}

export function resolveSDKConfig<T extends object>(inline: T | undefined, file: unknown, section: string): T {
  if (file !== undefined && inline !== undefined) {
    throw new TypeError(`[${LOG_PREFIX}] ${section}: config and configFile are mutually exclusive.`)
  }

  const config = file !== undefined ? file : inline ?? {}
  assertConfigObject(config, `${section}.${file !== undefined ? 'configFile default export' : 'config'}`)

  if (file === undefined) {
    assertSerializable(config, `${section}.config`)
  }

  return config as T
}

export function isPageviewStrategy(value: unknown): value is PageviewStrategy {
  return (PAGEVIEW_STRATEGIES as readonly unknown[]).includes(value)
}

export function assertPageviewStrategy(value: unknown, field: string): asserts value is PageviewStrategy {
  if (!isPageviewStrategy(value)) {
    throw new TypeError(`[${LOG_PREFIX}] ${field} must be ${PAGEVIEW_STRATEGY_LIST}.`)
  }
}

/** Read a runtime pageview strategy, warning and falling back to `'router'` for unknown values. */
export function resolvePageviewStrategy(value: unknown): PageviewStrategy {
  if (isPageviewStrategy(value)) {
    return value
  }

  logger.warn(`client.pageviewStrategy must be ${PAGEVIEW_STRATEGY_LIST}; using 'router'.`)
  return 'router'
}
