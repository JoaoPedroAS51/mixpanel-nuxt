import { describe, expect, it } from 'vitest'
import { resolvePageviewMode, resolveUrlFilters, withoutSDKPageviews } from '../../../src/runtime/pageview/config'

describe('pageview mode', () => {
  it.each([
    { name: 'nothing configured', config: {}, expected: false },
    { name: 'track_pageview: false', config: { track_pageview: false }, expected: false },
    { name: 'track_pageview: true', config: { track_pageview: true }, expected: true },
    { name: 'track_pageview with a URL mode', config: { track_pageview: 'url-with-path' as const }, expected: 'url-with-path' },
    { name: 'autocapture: true', config: { autocapture: true }, expected: 'full-url' },
    { name: 'autocapture without pageview', config: { autocapture: { click: false } }, expected: 'full-url' },
    { name: 'autocapture with pageview', config: { autocapture: { pageview: 'url-with-path-and-query-string' as const } }, expected: 'url-with-path-and-query-string' },
    { name: 'autocapture with pageview disabled', config: { autocapture: { pageview: false } }, expected: false },
    { name: 'autocapture: false with track_pageview', config: { autocapture: false, track_pageview: 'full-url' as const }, expected: 'full-url' },
  ])('resolves $expected from $name', ({ config, expected }) => {
    expect(resolvePageviewMode(config)).toBe(expected)
  })

  it('ignores track_pageview when autocapture is enabled', () => {
    expect(resolvePageviewMode({ autocapture: { pageview: false }, track_pageview: 'full-url' })).toBe(false)
  })
})

describe('autocapture URL filters', () => {
  it('reads allow and block lists from the autocapture object', () => {
    const allow = [/\/app/]
    const block = [/\/admin/]

    expect(resolveUrlFilters({ autocapture: { allow_url_regexes: allow, block_url_regexes: block } })).toEqual({ allow, block })
  })

  it.each([
    { name: 'autocapture is disabled', config: { track_pageview: true } },
    { name: 'autocapture is true', config: { autocapture: true } },
    { name: 'both lists are empty', config: { autocapture: { allow_url_regexes: [], block_url_regexes: [] } } },
  ])('returns no filters when $name', ({ config }) => {
    expect(resolveUrlFilters(config)).toBeUndefined()
  })
})

describe('SDK pageview sources', () => {
  it('disables track_pageview without enabling autocapture', () => {
    expect(withoutSDKPageviews({ track_pageview: 'full-url', debug: true })).toEqual({ track_pageview: false, debug: true })
  })

  it('turns autocapture: true into an object without pageviews', () => {
    expect(withoutSDKPageviews({ autocapture: true })).toEqual({ track_pageview: false, autocapture: { pageview: false } })
  })

  it('keeps the other autocapture options', () => {
    const config = { autocapture: { click: false, scroll: true, pageview: 'url-with-path' as const } }

    expect(withoutSDKPageviews(config)).toEqual({
      track_pageview: false,
      autocapture: { click: false, scroll: true, pageview: false },
    })
    expect(config.autocapture.pageview).toBe('url-with-path')
  })

  it('keeps callbacks from a configuration file by reference', () => {
    const loaded = () => {}

    expect(withoutSDKPageviews({ track_pageview: true, loaded }).loaded).toBe(loaded)
  })
})
