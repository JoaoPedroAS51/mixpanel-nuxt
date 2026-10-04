import { describe, expect, it, vi } from 'vitest'
import { createServerAccessor } from '../../src/runtime/server/client'
import type { MixpanelServerConfig, MixpanelServerSDK, ServerRuntimeOptions } from '../../src/runtime/types'

const options: ServerRuntimeOptions = {
  enabled: true,
  token: 'server-token',
  config: { geolocate: false },
}

describe('Node SDK access', () => {
  it('initializes only on first access', () => {
    const init = vi.fn(() => ({}))
    const sdk = { init } as unknown as MixpanelServerSDK
    const useClient = createServerAccessor(() => options, sdk, undefined)

    expect(init).not.toHaveBeenCalled()

    useClient()

    expect(init).toHaveBeenCalledExactlyOnceWith('server-token', options.config)
  })

  it('reuses the native instance on subsequent access', () => {
    const native = { track: vi.fn() }
    const init = vi.fn(() => native)
    const sdk = { init } as unknown as MixpanelServerSDK
    const useClient = createServerAccessor(() => options, sdk, undefined)

    const first = useClient()
    const second = useClient()

    expect(first).toBe(native)
    expect(second).toBe(first)
    expect(init).toHaveBeenCalledOnce()
  })

  it.each(['inline', 'file'])('prints SDK debug messages from %s configuration independently of the global console', (source) => {
    const config = Object.freeze({ debug: true })
    const init = vi.fn((_token: string, _config?: MixpanelServerConfig) => ({}))
    const sdk = { init } as unknown as MixpanelServerSDK
    const useClient = createServerAccessor(
      () => ({ ...options, config: source === 'inline' ? config : undefined }),
      sdk,
      source === 'file' ? config : undefined,
    )
    const consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)

    try {
      useClient()
      useClient()

      const sdkConfig = init.mock.calls[0]![1]
      sdkConfig?.logger?.debug('Mixpanel debug output')

      const output = stdout.mock.calls.map(([chunk]) => String(chunk)).join('')
      expect(output).toContain('Mixpanel debug output')
      expect(output).toContain('[mixpanel-nuxt]')
      expect(consoleDebug).not.toHaveBeenCalled()
      expect(config).toEqual({ debug: true })
      expect(init).toHaveBeenCalledOnce()
    }
    finally {
      stdout.mockRestore()
      consoleDebug.mockRestore()
    }
  })

  it.each([false, undefined])('keeps SDK defaults when debug is %s', (debug) => {
    const config = debug === undefined ? {} : { debug }
    const init = vi.fn(() => ({}))
    const sdk = { init } as unknown as MixpanelServerSDK

    createServerAccessor(() => ({ ...options, config }), sdk, undefined)()

    expect(init).toHaveBeenCalledExactlyOnceWith('server-token', config)
    expect(config).not.toHaveProperty('logger')
  })

  it.each([true, false])('preserves a custom logger when debug is %s', (debug) => {
    const logger = {
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }
    const config = Object.freeze({ debug, logger })
    const init = vi.fn((_token: string, _config?: MixpanelServerConfig) => ({}))
    const sdk = { init } as unknown as MixpanelServerSDK

    createServerAccessor(() => ({ ...options, config: undefined }), sdk, config)()

    expect(init.mock.calls[0]![1]?.logger).toBe(logger)
    expect(init).toHaveBeenCalledExactlyOnceWith('server-token', config)
  })

  it('preserves explicit identities on each operation', () => {
    const track = vi.fn()
    const sdk = { init: () => ({ track }) } as unknown as MixpanelServerSDK
    const client = createServerAccessor(() => options, sdk, undefined)()

    client.track('one', { distinct_id: 'first' })
    client.track('two', { distinct_id: 'second' })

    expect(track).toHaveBeenNthCalledWith(1, 'one', { distinct_id: 'first' })
    expect(track).toHaveBeenNthCalledWith(2, 'two', { distinct_id: 'second' })
  })

  it('preserves successful SDK callbacks', () => {
    const native = {
      track: (_event: string, _props: object, callback: () => void) => callback(),
    }
    const sdk = { init: () => native } as unknown as MixpanelServerSDK
    const client = createServerAccessor(() => options, sdk, undefined)()
    const callback = vi.fn()

    client.track('one', { distinct_id: 'first' }, callback)

    expect(callback).toHaveBeenCalledExactlyOnceWith()
  })

  it('preserves SDK callback errors', () => {
    const failure = new Error('ingestion unavailable')
    const native = {
      track: (_event: string, _props: object, callback: (error: Error) => void) => callback(failure),
    }
    const sdk = { init: () => native } as unknown as MixpanelServerSDK
    const client = createServerAccessor(() => options, sdk, undefined)()
    const callback = vi.fn()

    client.track('one', {}, callback)

    expect(callback).toHaveBeenCalledExactlyOnceWith(failure)
  })

  it.each([
    { name: 'disabled tracking', config: { ...options, enabled: false }, message: 'Enable mixpanel.server.enabled' },
  ])('reports $name', ({ config, message }) => {
    const sdk = { init: vi.fn() } as unknown as MixpanelServerSDK
    const useClient = createServerAccessor(() => config, sdk, undefined)

    expect(useClient).toThrow(message)
  })

  it('preserves SDK initialization errors with an empty token', () => {
    const failure = new Error('SDK token error')
    const init = vi.fn(() => {
      throw failure
    })
    const sdk = { init } as unknown as MixpanelServerSDK
    const useClient = createServerAccessor(() => ({ ...options, token: '' }), sdk, undefined)

    expect(useClient).toThrow(failure)
    expect(init).toHaveBeenCalledExactlyOnceWith('', options.config)
  })
})
