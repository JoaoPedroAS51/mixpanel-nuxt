import { abortNavigation, defineNuxtRouteMiddleware, navigateTo } from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { guard } = window.__pageviewFixture

  if (guard.blocked === to.path) {
    guard.cancelled++
    return abortNavigation()
  }

  const redirect = guard.redirects[to.path]

  if (redirect) {
    return navigateTo(redirect)
  }
})
