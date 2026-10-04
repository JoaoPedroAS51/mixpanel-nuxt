import { describe, expect, it } from 'vitest'
import { isNewPage, isPathChanged, isUrlTracked } from '../../../src/runtime/pageview/url'

describe('new page detection', () => {
  it.each([true, 'url-with-path', 'url-with-path-and-query-string', 'full-url'] as const)('records the first pageview with %s', (mode) => {
    expect(isNewPage(undefined, '/one', mode)).toBe(true)
  })

  it.each([
    { change: 'path', next: '/two', expected: { 'url-with-path': true, 'url-with-path-and-query-string': true, 'full-url': true } },
    { change: 'query', next: '/one?page=2', expected: { 'url-with-path': false, 'url-with-path-and-query-string': true, 'full-url': true } },
    { change: 'hash', next: '/one?page=1#reviews', expected: { 'url-with-path': false, 'url-with-path-and-query-string': false, 'full-url': true } },
    { change: 'nothing', next: '/one?page=1', expected: { 'url-with-path': false, 'url-with-path-and-query-string': false, 'full-url': false } },
  ] as const)('records a $change change only in the modes that compare it', ({ next, expected }) => {
    for (const [mode, isNew] of Object.entries(expected)) {
      expect(isNewPage('/one?page=1', next, mode as keyof typeof expected), mode).toBe(isNew)
    }
  })

  it('records only the first pageview with track_pageview: true', () => {
    expect(isNewPage('/one', '/two', true)).toBe(false)
  })
})

describe('path change detection', () => {
  it('ignores query and hash changes', () => {
    expect(isPathChanged('/one?page=1', '/one?page=2#reviews')).toBe(false)
  })

  it('detects a different path and the first pageview', () => {
    expect(isPathChanged('/one', '/two')).toBe(true)
    expect(isPathChanged(undefined, '/one')).toBe(true)
  })
})

describe('URL filter matching', () => {
  it('tracks only allowed URLs when an allowlist exists', () => {
    const filters = { allow: [/\/app\//], block: [/\/app\/admin/] }

    expect(isUrlTracked('https://example.test/app/admin', filters)).toBe(true)
    expect(isUrlTracked('https://example.test/blog', filters)).toBe(false)
  })

  it('skips blocked URLs without an allowlist', () => {
    const filters = { allow: [], block: [/\/admin/] }

    expect(isUrlTracked('https://example.test/admin', filters)).toBe(false)
    expect(isUrlTracked('https://example.test/blog', filters)).toBe(true)
  })
})
