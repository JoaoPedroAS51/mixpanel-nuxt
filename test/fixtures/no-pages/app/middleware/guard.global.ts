import { abortNavigation, defineNuxtRouteMiddleware, navigateTo } from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/blocked' || (import.meta.client && window.__noPages.blocked === to.path)) {
    return abortNavigation()
  }

  if (to.path === '/redirect') {
    return navigateTo('/first')
  }
})
