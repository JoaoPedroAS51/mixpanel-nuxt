import type NodeMixpanel from 'mixpanel'
import { describe, expectTypeOf, it } from 'vitest'
import type { MixpanelClient, MixpanelServer } from '../../src/runtime/types'

declare const client: MixpanelClient
declare const server: MixpanelServer

describe('browser SDK', () => {
  it('keeps the native method signatures', () => {
    expectTypeOf(client).not.toBeAny()

    client.track('event', { value: 1 }, response => void response)
    client.track('event', {}, { transport: 'sendBeacon' }, response => void response)
    client.people.set({ name: 'one' })
    client.get_group('org', 'one').set({ name: 'one' }).union('tags', ['test'])
    client.get_group('org', 'one').delete(response => void response)
  })

  it('returns identity and replay URL as possibly absent', () => {
    expectTypeOf(client.get_distinct_id()).toEqualTypeOf<string | undefined>()
    expectTypeOf(client.get_session_replay_url()).toEqualTypeOf<string | undefined>()
  })
})

describe('Node SDK', () => {
  it('is the native Node SDK instance', () => {
    expectTypeOf(server).not.toBeAny()
    expectTypeOf(server).toEqualTypeOf<ReturnType<typeof NodeMixpanel.init>>()
  })

  it('requires string event names', () => {
    server.track('event', { distinct_id: 'one' }, error => void error)

    // @ts-expect-error event names are strings
    server.track(123)
  })
})
