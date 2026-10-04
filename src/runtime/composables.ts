import { useNuxtApp } from '#imports'
import type { MixpanelClient } from './types'

/** Access the browser SDK, or its inactive implementation during SSR. */
export const useMixpanel = (): MixpanelClient => useNuxtApp().$mixpanel
