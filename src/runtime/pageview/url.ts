import type { PageviewMode } from '../types'
import type { UrlFilters } from './config'

function withoutHash(path: string) {
  return path.split('#')[0]!
}

function withoutSearch(path: string) {
  return withoutHash(path).split('?')[0]!
}

/**
 * Decide whether a navigation records a new pageview, using the URL parts that the SDK compares
 * for each mode.
 *
 * @param previous - Full path of the last recorded pageview, or `undefined` before the first one.
 * @param next - Full path of the destination.
 */
export function isNewPage(previous: string | undefined, next: string, mode: PageviewMode): boolean {
  if (previous === undefined) {
    return true
  }

  switch (mode) {
    case 'full-url':
      return next !== previous
    case 'url-with-path-and-query-string':
      return withoutHash(next) !== withoutHash(previous)
    case 'url-with-path':
      return isPathChanged(previous, next)
    case true:
      return false
  }
}

/** Decide whether the path, without query and hash, differs from the last recorded pageview. */
export function isPathChanged(previous: string | undefined, next: string): boolean {
  return previous === undefined || withoutSearch(next) !== withoutSearch(previous)
}

/** Apply autocapture URL filters: an allowlist takes precedence over the blocklist. */
export function isUrlTracked(url: string, filters: UrlFilters): boolean {
  if (filters.allow.length) {
    return filters.allow.some(pattern => pattern.test(url))
  }

  return !filters.block.some(pattern => pattern.test(url))
}
