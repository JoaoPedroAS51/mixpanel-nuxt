import { expectTypeOf } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import type { PageMeta } from '#app'
import { useNuxtApp } from '#imports'

export function checkPageviewTypes() {
  useNuxtApp().hook('mixpanel:pageview', (context) => {
    expectTypeOf(context.route).toEqualTypeOf<RouteLocationNormalized>()
    expectTypeOf(context.properties).toEqualTypeOf<Record<string, unknown>>()
    expectTypeOf(context.skip).toEqualTypeOf<boolean>()
    expectTypeOf(context.signal).toEqualTypeOf<AbortSignal>()
  })

  expectTypeOf<{ pageview: false }>().toExtend<PageMeta['mixpanel']>()
  expectTypeOf<{ pageview: { properties: { section: string } } }>().toExtend<PageMeta['mixpanel']>()
  expectTypeOf<{ pageview: true }>().not.toExtend<PageMeta['mixpanel']>()
}
