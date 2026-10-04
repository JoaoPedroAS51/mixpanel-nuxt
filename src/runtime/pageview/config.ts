import type { AutocaptureConfig } from 'mixpanel-browser'
import type { MixpanelClientConfig, PageviewMode } from '../types'

export interface UrlFilters {
  allow: RegExp[]
  block: RegExp[]
}

/** Default of `autocapture.pageview` in the browser SDK. */
const AUTOCAPTURE_PAGEVIEW: PageviewMode = 'full-url'

/**
 * Read the pageview setting the way the browser SDK does: `autocapture.pageview` when autocapture
 * is enabled, otherwise `track_pageview`.
 *
 * @returns The enabled mode, or `false` when pageviews are disabled.
 */
export function resolvePageviewMode(config: MixpanelClientConfig): PageviewMode | false {
  const { autocapture, track_pageview } = config

  if (autocapture) {
    return typeof autocapture === 'object' ? autocapture.pageview ?? AUTOCAPTURE_PAGEVIEW : AUTOCAPTURE_PAGEVIEW
  }

  return track_pageview ?? false
}

/**
 * Read the URL filters that autocapture applies to its pageviews.
 *
 * @returns The filters, or `undefined` when no filter applies.
 */
export function resolveUrlFilters(config: MixpanelClientConfig): UrlFilters | undefined {
  if (typeof config.autocapture !== 'object') {
    return undefined
  }

  const allow = config.autocapture.allow_url_regexes ?? []
  const block = config.autocapture.block_url_regexes ?? []

  return allow.length || block.length ? { allow, block } : undefined
}

/**
 * Copy the configuration with the SDK pageview sources disabled, keeping every other autocapture
 * option.
 */
export function withoutSDKPageviews(config: MixpanelClientConfig): MixpanelClientConfig {
  const { autocapture } = config

  if (!autocapture) {
    return { ...config, track_pageview: false }
  }

  const options: AutocaptureConfig = typeof autocapture === 'object' ? autocapture : {}

  return { ...config, track_pageview: false, autocapture: { ...options, pageview: false } }
}
