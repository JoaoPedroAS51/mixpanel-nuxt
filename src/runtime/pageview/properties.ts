import type { MixpanelPageMeta } from '../types'

interface RouteRecord {
  meta: { mixpanel?: MixpanelPageMeta }
}

interface Route {
  name?: unknown
  matched: readonly RouteRecord[]
}

/**
 * Build the pageview properties declared by a route: its `route_name`, then the page meta
 * properties merged from parent to child records.
 *
 * @returns The properties, or `false` when a record disables pageviews.
 */
export function resolveRouteProperties(route: Route): Record<string, unknown> | false {
  const properties: Record<string, unknown> = {}

  if (typeof route.name === 'string') {
    properties.route_name = route.name
  }

  for (const record of route.matched) {
    const pageview = record.meta.mixpanel?.pageview

    if (pageview === false) {
      return false
    }

    Object.assign(properties, pageview?.properties)
  }

  return properties
}
