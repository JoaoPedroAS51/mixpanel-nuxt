import { nextTick } from 'vue'
import { renderDOMHead } from '#mixpanel/unhead-client'
import { injectHead, useNuxtApp, useRoute, useRouter } from '#imports'
import type { NuxtApp } from '#app'
import type { RouteLocationNormalized } from '#vue-router'
import { logger } from '../logger'
import type { MixpanelClient, MixpanelClientConfig, MixpanelPageviewContext, PageviewMode } from '../types'
import { resolveUrlFilters } from './config'
import { resolveRouteProperties } from './properties'
import { isNewPage, isPathChanged, isUrlTracked } from './url'

/** The SDK marks the pageviews it records on its own, which router pageviews replace. */
const AUTOMATIC_PAGEVIEW_PROPERTIES = { $mp_autocapture: true }

interface Navigation {
  route: RouteLocationNormalized
  controller: AbortController
}

/**
 * Record a pageview for each confirmed router navigation, after the page and its head render.
 *
 * Works with the Vue Router used by `pages/` and with the minimal router Nuxt installs without it.
 * Call it inside the Nuxt app context.
 */
export function trackRouterPageviews(sdk: MixpanelClient, config: MixpanelClientConfig, mode: PageviewMode) {
  const nuxtApp = useNuxtApp()
  const router = useRouter()
  const renderedRoute = useRoute()
  const head = injectHead()
  const urlFilters = resolveUrlFilters(config)

  if (import.meta.dev && config.record_heatmap_data) {
    logger.warn('With client.pageviewStrategy: \'router\' and record_heatmap_data enabled, the SDK also records its own pageviews, causing duplicate pageviews in recorded sessions.')
  }

  // Rendering

  const appReady = new Promise<void>((resolve) => {
    nuxtApp.hooks.hookOnce('app:suspense:resolve', () => resolve())
  })

  // Nuxt also signals the end of page loading for failed and same-key navigations, sometimes while
  // a page with async setup is still pending, and does not signal it again when that page finishes.
  let pagePending = false

  nuxtApp.hook('page:start', () => {
    pagePending = true
  })
  nuxtApp.hook('page:finish', () => {
    pagePending = false
  })

  /**
   * Resolve when the destination page has rendered: page loading ended since the navigation, no
   * page is pending and the rendered route is the destination, or an error page replaced it. Also
   * resolves when the navigation is aborted, so no listener outlives it.
   */
  function waitForPageRender(route: RouteLocationNormalized, signal: AbortSignal) {
    if (nuxtApp.isHydrating || !route.matched.length) {
      return nextTick()
    }

    return new Promise<void>((resolve) => {
      let loadingEnded = false

      const finish = () => {
        stopListeners.forEach(stop => stop())
        signal.removeEventListener('abort', finish)
        resolve()
      }
      const finishWhenRendered = () => {
        if (loadingEnded && !pagePending && renderedRoute.fullPath === route.fullPath) finish()
      }
      const stopListeners = [
        nuxtApp.hook('page:loading:end', () => {
          loadingEnded = true
          finishWhenRendered()
        }),
        nuxtApp.hook('page:finish', finishWhenRendered),
        nuxtApp.hook('app:error', finish),
      ]
      signal.addEventListener('abort', finish, { once: true })
    })
  }

  // Navigations

  let current: Navigation | undefined
  let lastRecordedPath: string | undefined

  function startNavigation(route: RouteLocationNormalized, { waitForPage }: { waitForPage: boolean }) {
    current?.controller.abort()

    const navigation = { route, controller: new AbortController() }
    const rendered = waitForPage ? waitForPageRender(route, navigation.controller.signal) : Promise.resolve()
    current = navigation

    record(navigation, rendered).catch((error: unknown) => {
      logger.error('Failed to record a pageview.', error)
    })
  }

  // Recording

  async function record(navigation: Navigation, rendered: Promise<void>) {
    const { route, controller } = navigation
    const routeProperties = resolveRouteProperties(route)

    if (routeProperties === false || !isNewPage(lastRecordedPath, route.fullPath, mode)) return
    if (urlFilters && !isUrlTracked(window.location.href, urlFilters)) return

    // Nuxt replaces the initial route once the app is created, so hook handlers wait until the
    // navigation that survives hydration is known.
    await appReady

    if (navigation !== current) return

    const properties = { ...AUTOMATIC_PAGEVIEW_PROPERTIES, ...routeProperties }
    const context: MixpanelPageviewContext<RouteLocationNormalized> = {
      route,
      properties: { ...properties },
      skip: false,
      signal: controller.signal,
    }

    await Promise.all([runHook(context, properties), rendered])
    await pendingTransition(nuxtApp)

    if (navigation !== current || context.skip) return

    await nextTick()
    renderDOMHead(head)

    if (navigation !== current) return

    sdk.track_pageview(context.properties)

    if (isPathChanged(lastRecordedPath, route.fullPath)) {
      resetScrollCheckpoint(sdk)
    }

    lastRecordedPath = route.fullPath
  }

  async function runHook(context: MixpanelPageviewContext<RouteLocationNormalized>, properties: Record<string, unknown>) {
    try {
      await nuxtApp.hooks.callHookParallel('mixpanel:pageview', context)
    }
    catch (error) {
      logger.error('A mixpanel:pageview handler failed. The pageview is sent without hook properties.', error)
      context.properties = { ...properties }
    }
  }

  startNavigation(router.currentRoute.value, { waitForPage: false })

  router.afterEach((to, _from, failure) => {
    if (!failure) {
      startNavigation(to, { waitForPage: true })
    }
  })
}

/** Nuxt defers removing the previous page head entries until this promise settles. */
function pendingTransition(nuxtApp: NuxtApp) {
  return (nuxtApp as NuxtApp & { '~transitionPromise'?: Promise<void> })['~transitionPromise']
}

/**
 * Autocapture resets its scroll checkpoints only in its own pageview listener, which router
 * pageviews disable.
 */
function resetScrollCheckpoint(sdk: MixpanelClient) {
  const autocapture = (sdk as MixpanelClient & { autocapture?: { lastScrollCheckpoint?: number } }).autocapture

  if (autocapture && 'lastScrollCheckpoint' in autocapture) {
    autocapture.lastScrollCheckpoint = 0
  }
}
