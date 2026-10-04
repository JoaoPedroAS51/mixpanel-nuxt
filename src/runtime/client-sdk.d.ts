import type { Callback, Config } from 'mixpanel-browser'

declare module 'mixpanel-browser' {
  interface Group {
    delete(callback?: Callback): void
  }
}

export type MixpanelClientConfig = Partial<Config>
