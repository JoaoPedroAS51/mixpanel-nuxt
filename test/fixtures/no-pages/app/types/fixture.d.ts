import type { navigateTo } from 'nuxt/app'

declare global {
  interface Window {
    __navigate: typeof navigateTo
    __noPages: { blocked?: string }
  }
}

export {}
