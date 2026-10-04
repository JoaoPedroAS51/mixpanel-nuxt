import { describe, expect, it } from 'vitest'
import { resolveRouteProperties } from '../../../src/runtime/pageview/properties'
import type { MixpanelPageMeta } from '../../../src/runtime/types'

function record(pageview?: MixpanelPageMeta['pageview']) {
  return { meta: pageview === undefined ? {} : { mixpanel: { pageview } } }
}

describe('route pageview properties', () => {
  it('sends the route name', () => {
    expect(resolveRouteProperties({ name: 'lease-id', matched: [record()] })).toEqual({ route_name: 'lease-id' })
  })

  it('omits route_name when the route has no string name', () => {
    expect(resolveRouteProperties({ name: undefined, matched: [] })).toEqual({})
    expect(resolveRouteProperties({ name: Symbol('internal'), matched: [] })).toEqual({})
  })

  it('merges meta properties from parent to child records', () => {
    const route = {
      name: 'lease-id-documents',
      matched: [
        record({ properties: { section: 'lease', area: 'parent' } }),
        record(),
        record({ properties: { area: 'documents' } }),
      ],
    }

    expect(resolveRouteProperties(route)).toEqual({ route_name: 'lease-id-documents', section: 'lease', area: 'documents' })
  })

  it('lets meta properties replace route_name', () => {
    expect(resolveRouteProperties({ name: 'index', matched: [record({ properties: { route_name: 'home' } })] })).toEqual({ route_name: 'home' })
  })

  it.each([0, 1])('disables the pageview when record %i sets pageview: false', (disabled) => {
    const matched = [record({ properties: { section: 'lease' } }), record({ properties: { area: 'documents' } })]
    matched[disabled] = record(false)

    expect(resolveRouteProperties({ name: 'lease', matched })).toBe(false)
  })
})
