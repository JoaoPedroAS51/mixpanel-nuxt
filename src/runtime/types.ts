import type { FlagsManager, Mixpanel, TrackPageView } from 'mixpanel-browser'
import type { MixpanelClientConfig } from './client-sdk'
import type { MixpanelServerConfig } from './server-sdk'

export type { MixpanelClientConfig } from './client-sdk'
export type { MixpanelServerConfig, MixpanelServer, MixpanelServerSDK } from './server-sdk'

// Inactive browser reads

type OptionalValue<T> = T extends Promise<infer Value>
  ? Promise<Value | undefined>
  : T | undefined

type OptionalResult<T> = T extends (...args: infer Args) => infer Result
  ? (...args: Args) => OptionalValue<Result>
  : never

type ClientGetter
  = | 'get_config'
    | 'get_distinct_id'
    | 'get_property'
    | 'get_session_replay_url'
    | 'get_session_recording_properties'
    | 'has_opted_in_tracking'
    | 'has_opted_out_tracking'

type FlagGetter = Exclude<keyof FlagsManager, 'load_flags' | 'update_context'>

export type MixpanelClientFlags = Omit<FlagsManager, FlagGetter> & {
  [K in FlagGetter]: OptionalResult<FlagsManager[K]>
}

/** Browser SDK API, with absent read results while tracking is inactive. */
export type MixpanelClient = Omit<Mixpanel, ClientGetter | 'flags' | 'init'> & {
  [K in ClientGetter]: K extends 'get_distinct_id'
    ? () => string | undefined
    : OptionalResult<Mixpanel[K]>
} & {
  flags: MixpanelClientFlags
  init: (...args: Parameters<Mixpanel['init']>) => MixpanelClient
}

// Inline configuration

type IsAny<T> = 0 extends (1 & T) ? true : false

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

type JsonConfig<T> = IsAny<T> extends true
  ? JsonValue
  : T extends (...args: never[]) => unknown
    ? never
    : T extends RegExp
      ? never
      : T extends string | number | boolean | null | undefined
        ? T
        : T extends readonly unknown[]
          ? { [K in keyof T]: JsonConfig<T[K]> }
          : T extends object
            ? { [K in keyof T]: JsonConfig<T[K]> }
            : never

export type InlineClientConfig = JsonConfig<MixpanelClientConfig>
export type InlineServerConfig = Omit<JsonConfig<MixpanelServerConfig>, 'credentials' | 'logger'>

// Pageviews

/**
 * Implementation of the pageviews enabled by `track_pageview` or `autocapture.pageview`.
 *
 * - `router`: the module records confirmed router navigations after the page and its head render.
 * - `native`: the browser SDK records URL changes on its own.
 */
export type PageviewStrategy = 'router' | 'native'

/** Pageview setting of the browser SDK that records at least the initial pageview. */
export type PageviewMode = Exclude<TrackPageView, false>

/** Pageview options for a page, set with `definePageMeta({ mixpanel: { pageview } })`. */
export interface MixpanelPageMeta {
  /** `false` disables pageviews for the route and its children. */
  pageview?: false | {
    /** Properties sent with the pageview, merged from parent to child routes. */
    properties?: Record<string, unknown>
  }
}

/** Argument of the `mixpanel:pageview` runtime hook. */
export interface MixpanelPageviewContext<Route = unknown> {
  /** Destination of the confirmed navigation. */
  readonly route: Route
  /** Properties sent with the pageview. Starts with `$mp_autocapture`, `route_name` and the page meta properties. */
  properties: Record<string, unknown>
  /** Set to `true` to drop the pageview. */
  skip: boolean
  /** Aborted when another navigation replaces this one before the pageview is sent. */
  readonly signal: AbortSignal
}

// Runtime configuration

export interface SDKRuntimeOptions<T> {
  enabled: boolean
  token: string
  config?: T
}

export interface ClientRuntimeOptions extends SDKRuntimeOptions<InlineClientConfig> {
  pageviewStrategy: PageviewStrategy
}

export type ServerRuntimeOptions = SDKRuntimeOptions<InlineServerConfig>

// Module configuration

type ConfigSource<T>
  = | {
    config?: T
    configFile?: never
  }
  | {
    config?: never
    configFile: string
  }

export type ClientOptions = Partial<Pick<ClientRuntimeOptions, 'enabled' | 'token' | 'pageviewStrategy'>> & ConfigSource<InlineClientConfig>
export type ServerOptions = Partial<Pick<ServerRuntimeOptions, 'enabled' | 'token'>> & ConfigSource<InlineServerConfig>

export interface ModuleOptions {
  client: ClientOptions
  server: ServerOptions
}

export interface ModulePublicRuntimeConfig {
  mixpanel: { client: Pick<ClientRuntimeOptions, keyof ClientRuntimeOptions> }
}

export interface ModuleRuntimeConfig {
  mixpanel: { server: Pick<ServerRuntimeOptions, keyof ServerRuntimeOptions> }
}
