import { describe, expect, it, vi } from 'vitest'
import { createInactiveClient } from '../../src/runtime/inactive-client'

describe('inactive browser client', () => {
  it('accepts tracking overloads without invoking callbacks', () => {
    const sdk = createInactiveClient()
    const callback = vi.fn()

    sdk.track('event', { value: 1 }, callback)
    sdk.track('event', {}, { send_immediately: true }, callback)
    sdk.push([callback])

    expect(callback).not.toHaveBeenCalled()
  })

  it('does not retain identity or registered properties', () => {
    const sdk = createInactiveClient()

    sdk.identify('user')
    sdk.register({ key: 'value' })

    expect(sdk.get_distinct_id()).toBeUndefined()
    expect(sdk.get_property('key')).toBeUndefined()
  })

  it('accepts people operations without invoking callbacks', () => {
    const sdk = createInactiveClient()
    const callback = vi.fn()

    sdk.people.set({ name: 'Example' }, callback)
    sdk.people.set_once('name', 'Example', callback)
    sdk.people.increment('count', 1, callback)

    expect(callback).not.toHaveBeenCalled()
  })

  it('preserves group chaining without invoking callbacks', () => {
    const group = createInactiveClient().get_group('org', 'one')
    const callback = vi.fn()

    const result = group
      .set({ name: 'One' }, undefined, callback)
      .set_once({ plan: 'test' }, undefined, callback)
      .union('tags', ['test'], callback)
      .remove('tags', 'test', callback)

    group.unset('name', callback)

    expect(result).toBe(group)
    expect(callback).not.toHaveBeenCalled()
  })

  it('ignores group deletion without invoking its callback', () => {
    const group = createInactiveClient().get_group('org', 'one')
    const callback = vi.fn()

    expect(group.delete(callback)).toBeUndefined()
    expect(callback).not.toHaveBeenCalled()
  })

  it('returns absent configuration, recording and consent state', () => {
    const sdk = createInactiveClient()

    expect(sdk.get_config('token')).toBeUndefined()
    expect(sdk.get_session_replay_url()).toBeUndefined()
    expect(sdk.get_session_recording_properties()).toBeUndefined()
    expect(sdk.has_opted_in_tracking()).toBeUndefined()
    expect(sdk.has_opted_out_tracking()).toBeUndefined()
  })

  it('keeps init chainable without retaining configuration', () => {
    const sdk = createInactiveClient()

    expect(sdk.init('ignored', { debug: true })).toBe(sdk)
    expect(sdk.get_config('token')).toBeUndefined()
    expect(sdk.get_config('debug')).toBeUndefined()
  })

  it('does not retain configuration set with set_config', () => {
    const sdk = createInactiveClient()

    sdk.set_config({ api_host: 'https://ignored.test', debug: true })

    expect(sdk.get_config('api_host')).toBeUndefined()
    expect(sdk.get_config('debug')).toBeUndefined()
  })

  it('returns absent synchronous flag state', () => {
    const flags = createInactiveClient().flags

    expect(flags.are_flags_ready()).toBeUndefined()
    expect(flags.get_variant_sync('feature', { key: 'fallback', value: true })).toBeUndefined()
    expect(flags.get_variant_value_sync('feature', true)).toBeUndefined()
    expect(flags.get_all_variants_sync()).toBeUndefined()
    expect(flags.is_enabled_sync('feature', true)).toBeUndefined()
  })

  it('settles asynchronous flag operations without state', async () => {
    const flags = createInactiveClient().flags

    await expect(flags.load_flags()).resolves.toBeUndefined()
    await expect(flags.when_ready()).resolves.toBeUndefined()
    await expect(flags.update_context({ user: 'one' })).resolves.toBeUndefined()
  })

  it('resolves asynchronous flag reads with absent values', async () => {
    const flags = createInactiveClient().flags

    await expect(flags.get_variant('feature', { key: 'fallback', value: true })).resolves.toBeUndefined()
    await expect(flags.get_variant_value('feature', true)).resolves.toBeUndefined()
    await expect(flags.get_all_variants()).resolves.toBeUndefined()
    await expect(flags.is_enabled('feature', true)).resolves.toBeUndefined()
  })

  it('creates independent inactive instances', () => {
    const firstApp = createInactiveClient()
    const secondApp = createInactiveClient()

    expect(firstApp).not.toBe(secondApp)
    expect(firstApp.people).not.toBe(secondApp.people)
    expect(firstApp.flags).not.toBe(secondApp.flags)
    expect(firstApp.get_group('org', 'one')).not.toBe(secondApp.get_group('org', 'one'))
  })
})
