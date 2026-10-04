import { defineNuxtRouteMiddleware, navigateTo, abortNavigation } from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/blocked') {
    return abortNavigation()
  }

  if (to.path === '/redirect') {
    return navigateTo('/one')
  }
})
