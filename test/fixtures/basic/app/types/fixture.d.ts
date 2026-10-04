import type { navigateTo } from 'nuxt/app'
import type { MixpanelClient } from 'mixpanel-nuxt/config'

export interface PageviewHookCall {
  path: string
  aborted: boolean
  release: () => void
}

/** Controls the router pageview fixture exposes to tests as `window.__pageviewFixture`. */
export interface PageviewFixture {
  heldLeaves: Array<() => void>
  releaseLeaves: () => void
  guard: { blocked?: string, redirects: Record<string, string>, cancelled: number }
  hook: {
    mode: 'none' | 'sync' | 'async' | 'error' | 'skip'
    properties: Record<string, unknown>
    calls: PageviewHookCall[]
  }
}

declare global {
  interface Window {
    __sdk: MixpanelClient
    __navigate: typeof navigateTo
    __mixpanelLoaded?: number
    __mixpanelErrors?: string[]
    __pageviewFixture: PageviewFixture
  }
}
