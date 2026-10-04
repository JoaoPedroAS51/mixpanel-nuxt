import { defineNuxtRouteMiddleware, useMixpanel } from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.client && to.query.identify === 'middleware') {
    useMixpanel().identify('middleware-user')
    useMixpanel().register({ plan: 'middleware' })
  }
})
