import type { TransitionProps } from 'vue'
import { defineNuxtPlugin, navigateTo, useHead, useMixpanel, useRoute } from '#imports'
import type { PageviewFixture } from '../types/fixture'
import { holdLeave, pageTransitionKey } from '../utils/transitions'

export default defineNuxtPlugin({
  name: 'pageview-fixture',
  dependsOn: ['mixpanel'],
  setup(nuxtApp) {
    const route = useRoute()
    const fixture: PageviewFixture = {
      heldLeaves: [],
      releaseLeaves: () => fixture.heldLeaves.splice(0).forEach(done => done()),
      guard: { redirects: {}, cancelled: 0 },
      hook: { mode: 'none', properties: {}, calls: [] },
    }
    window.__pageviewFixture = fixture
    window.__navigate = navigateTo

    useHead({ title: 'Fixture app' })

    const transitionMode = route.query.pageTransition

    if (transitionMode === 'default' || transitionMode === 'out-in' || transitionMode === 'in-out') {
      const transition: TransitionProps = { css: false, onLeave: holdLeave, mode: transitionMode === 'default' ? undefined : transitionMode }
      nuxtApp.vueApp.provide(pageTransitionKey, transition)
    }

    if (route.query.identify === 'plugin') {
      useMixpanel().identify('plugin-user')
      useMixpanel().register({ plan: 'plugin' })
    }

    nuxtApp.hook('mixpanel:pageview', async (context) => {
      const { hook } = fixture

      if (hook.mode === 'skip') {
        context.skip = true
      }
      else if (hook.mode === 'error') {
        Object.assign(context.properties, hook.properties)
        throw new Error('Fixture hook failure')
      }
      else if (hook.mode === 'sync') {
        Object.assign(context.properties, hook.properties)
      }
      else if (hook.mode === 'async') {
        const call = { path: context.route.fullPath, aborted: false, release: () => {} }
        hook.calls.push(call)
        await new Promise<void>((resolve) => {
          call.release = resolve
        })
        call.aborted = context.signal.aborted
        Object.assign(context.properties, hook.properties, { hook_path: context.route.fullPath })
      }
    })
  },
})
