import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ClientRuntimeOptions } from '../../src/runtime/types'

const state = vi.hoisted(() => ({
  fileLoads: 0,
  sdkLoads: 0,
  init: vi.fn(),
  trackRouterPageviews: vi.fn(),
  file: undefined as unknown,
}))

vi.mock('#imports', () => ({ defineNuxtPlugin: (plugin: unknown) => plugin }))

vi.mock('../../src/runtime/pageview/router', () => ({ trackRouterPageviews: state.trackRouterPageviews }))

beforeEach(() => {
  vi.resetModules()
  state.fileLoads = 0
  state.sdkLoads = 0
  state.file = undefined
  state.init.mockReset()
  state.trackRouterPageviews.mockReset()

  vi.doMock('#mixpanel/client-config', () => {
    state.fileLoads++

    return { default: state.file }
  })
  vi.doMock('mixpanel-browser', () => {
    state.sdkLoads++

    return { default: { init: state.init } }
  })
})

async function setupClient(options: ClientRuntimeOptions) {
  const { default: plugin } = await import('../../src/runtime/plugin.client')
  const nuxtApp = {
    runWithContext: (callback: () => unknown) => callback(),
    $config: {
      public: {
        mixpanel: { client: options },
      },
    },
  }

  return plugin.setup!(nuxtApp as never)
}

describe('Nuxt app plugins', () => {
  it('does not load the SDK or configuration file in SSR', async () => {
    const { default: plugin } = await import('../../src/runtime/plugin.server')
    const provided = await plugin.setup!({} as never)

    expect(provided).toBeDefined()
    expect(provided!.provide!.mixpanel).toBeDefined()
    expect(provided!.provide!.mixpanel.get_distinct_id()).toBeUndefined()
    expect(state.sdkLoads).toBe(0)
    expect(state.fileLoads).toBe(0)
  })

  it('does not load client modules when disabled', async () => {
    const provided = await setupClient({ enabled: false, token: 'token', pageviewStrategy: 'router' })

    expect(provided).toBeDefined()
    expect(provided!.provide!.mixpanel).toBeDefined()

    provided!.provide!.mixpanel.track('ignored')

    expect(state.fileLoads).toBe(0)
    expect(state.sdkLoads).toBe(0)
  })

  it('does not share inactive clients between SSR apps', async () => {
    const { default: plugin } = await import('../../src/runtime/plugin.server')
    const first = await plugin.setup!({} as never)
    const second = await plugin.setup!({} as never)
    const firstClient = first!.provide!.mixpanel
    const secondClient = second!.provide!.mixpanel

    expect(firstClient).not.toBe(secondClient)
    expect(firstClient.people).not.toBe(secondClient.people)
    expect(firstClient.flags).not.toBe(secondClient.flags)
    expect(firstClient.get_group('org', 'one')).not.toBe(secondClient.get_group('org', 'one'))
  })

  it('initializes the browser SDK with an empty token', async () => {
    const native = { track: vi.fn() }
    state.init.mockReturnValue(native)

    const provided = await setupClient({ enabled: true, token: '', pageviewStrategy: 'router' })

    expect(state.init).toHaveBeenCalledExactlyOnceWith('', {}, 'mixpanel-nuxt')
    expect(provided!.provide!.mixpanel).toBe(native)
    expect(state.sdkLoads).toBe(1)
    expect(state.fileLoads).toBe(1)
  })

  it('passes runtime token and config unchanged to the native SDK with the native pageview strategy', async () => {
    const native = { track: vi.fn() }
    state.init.mockReturnValue(native)
    const config = { track_pageview: true }

    const provided = await setupClient({ enabled: true, token: 'deploy-token', pageviewStrategy: 'native', config })

    expect(state.init).toHaveBeenCalledExactlyOnceWith('deploy-token', config, 'mixpanel-nuxt')
    expect(state.trackRouterPageviews).not.toHaveBeenCalled()
    expect(provided).toBeDefined()
    expect(provided!.provide!.mixpanel).toBe(native)
  })

  it('moves enabled pageviews from the SDK to the router', async () => {
    const native = { track: vi.fn() }
    state.init.mockReturnValue(native)
    const config = Object.freeze({ track_pageview: 'url-with-path' as const, debug: true })

    await setupClient({ enabled: true, token: 'deploy-token', pageviewStrategy: 'router', config })

    expect(state.init).toHaveBeenCalledExactlyOnceWith('deploy-token', { track_pageview: false, debug: true }, 'mixpanel-nuxt')
    expect(state.trackRouterPageviews).toHaveBeenCalledExactlyOnceWith(native, config, 'url-with-path')
    expect(state.init.mock.calls[0]![1]).not.toBe(config)
    expect(config.track_pageview).toBe('url-with-path')
  })

  it('leaves the SDK configuration unchanged when pageviews are disabled', async () => {
    state.init.mockReturnValue({})
    const config = { autocapture: { pageview: false as const } }

    await setupClient({ enabled: true, token: 'deploy-token', pageviewStrategy: 'router', config })

    expect(state.init.mock.calls[0]![1]).toBe(config)
    expect(state.trackRouterPageviews).not.toHaveBeenCalled()
  })

  it('preserves non-serializable file configuration', async () => {
    const loaded = vi.fn()
    state.file = { loaded, record_block_class: /private/ }
    state.init.mockReturnValue({})

    await setupClient({ enabled: true, token: 'deploy-token', pageviewStrategy: 'router' })

    expect(state.init.mock.calls[0]![1]).toBe(state.file)
    expect(loaded).not.toHaveBeenCalled()
  })
})
