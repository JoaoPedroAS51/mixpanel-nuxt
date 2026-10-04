import { describe, expect, it, vi } from 'vitest'
import { defineMixpanelClientConfig, defineMixpanelServerConfig } from '../../src/config'
import { assertPageviewStrategy, assertSerializable, resolvePageviewStrategy, resolveSDKConfig } from '../../src/runtime/config'

const invalidObjects = [
  { name: 'null', value: null },
  { name: 'array', value: [] },
  { name: 'factory', value: () => ({}) },
  { name: 'promise', value: Promise.resolve({}) },
  { name: 'regular expression', value: /test/ },
]

describe('configuration helpers', () => {
  it('preserves browser callbacks and regular expressions', () => {
    const config = {
      loaded() {
        throw new Error('must not run')
      },
      record_block_class: /private/,
    }

    const result = defineMixpanelClientConfig(config)

    expect(result).toBe(config)
  })

  it('preserves the server logger without invoking it', () => {
    const logger = {
      trace() {},
      debug() {},
      info() {},
      warn() {},
      error() {},
    }

    const result = defineMixpanelServerConfig({ logger })

    expect(result.logger).toBe(logger)
  })

  it.each([
    ...invalidObjects,
    { name: 'undefined', value: undefined },
  ])('rejects $name as a configuration object', ({ value }) => {
    expect(() => defineMixpanelClientConfig(value as never)).toThrow('plain configuration object')
    expect(() => defineMixpanelServerConfig(value as never)).toThrow('plain configuration object')
  })

  it('loads without Nuxt Kit or either SDK', async () => {
    const forbidden = ['@nuxt/kit', 'mixpanel', 'mixpanel-browser']

    for (const id of forbidden) {
      vi.doMock(id, () => {
        throw new Error(`${id} imported by the configuration entry`)
      })
    }
    vi.resetModules()

    try {
      await expect(import('../../src/config')).resolves.toHaveProperty('defineMixpanelClientConfig')
    }
    finally {
      forbidden.forEach(id => vi.doUnmock(id))
    }
  })
})

describe('inline serialization', () => {
  it('accepts nested JSON SDK options', () => {
    const config = {
      debug: false,
      track_pageview: true,
      autocapture: { click: true },
      property_blacklist: ['email'],
    }

    expect(() => assertSerializable(config, 'client.config')).not.toThrow()
  })

  it.each([
    { name: 'function', value: () => {} },
    { name: 'regular expression', value: /private/ },
    { name: 'Map', value: new Map() },
    { name: 'Set', value: new Set() },
    { name: 'Date', value: new Date() },
    { name: 'NaN', value: Number.NaN },
    { name: 'Infinity', value: Infinity },
    { name: 'bigint', value: 1n },
    { name: 'undefined', value: undefined },
  ])('reports the nested field containing $name', ({ value }) => {
    const config = { nested: { value } }

    expect(() => assertSerializable(config, 'client.config')).toThrow('client.config.nested.value')
  })

  it('rejects circular references', () => {
    const config: Record<string, unknown> = {}
    config.self = config

    expect(() => assertSerializable(config, 'client.config')).toThrow('circular')
  })

  it('rejects accessors without invoking them', () => {
    const config = {
      get debug() {
        throw new Error('must not run')
      },
    }

    expect(() => assertSerializable(config, 'client.config')).toThrow('JSON data property')
  })
})

describe('configuration source resolution', () => {
  it.each(invalidObjects)('rejects a file value containing $name', ({ value }) => {
    expect(() => resolveSDKConfig(undefined, value, 'client')).toThrow('plain configuration object')
  })

  it.each(['client', 'server'])('rejects simultaneous inline and file configuration for %s', (section) => {
    expect(() => resolveSDKConfig({}, {}, section)).toThrow(`${section}: config and configFile are mutually exclusive`)
  })

  it('uses the inline object unchanged', () => {
    const inline = { track_pageview: false }

    const result = resolveSDKConfig(inline, undefined, 'client')

    expect(result).toBe(inline)
  })

  it('uses the file object unchanged', () => {
    const file = { loaded() {} }

    const result = resolveSDKConfig(undefined, file, 'client')

    expect(result).toBe(file)
  })

  it('defaults to an empty object when neither source is supplied', () => {
    const result = resolveSDKConfig(undefined, undefined, 'server')

    expect(result).toEqual({})
  })
})

describe('pageview strategy', () => {
  it.each(['router', 'native'])('accepts %s', (strategy) => {
    expect(() => assertPageviewStrategy(strategy, 'client.pageviewStrategy')).not.toThrow()
    expect(resolvePageviewStrategy(strategy)).toBe(strategy)
  })

  it('rejects an unknown strategy at build time', () => {
    expect(() => assertPageviewStrategy('sdk', 'client.pageviewStrategy')).toThrow('client.pageviewStrategy must be \'router\' or \'native\'')
  })

  it('warns and falls back to router for an unknown runtime strategy', () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true)

    try {
      expect(resolvePageviewStrategy('sdk')).toBe('router')
      expect(stderr.mock.calls.map(([chunk]) => String(chunk)).join('')).toContain('client.pageviewStrategy must be \'router\' or \'native\'; using \'router\'.')
    }
    finally {
      stderr.mockRestore()
    }
  })
})
