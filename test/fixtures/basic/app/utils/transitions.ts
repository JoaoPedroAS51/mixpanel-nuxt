import type { InjectionKey, TransitionProps } from 'vue'

/** Page transition the router fixture passes to `<NuxtPage>` in the base `app.vue`. */
export const pageTransitionKey: InjectionKey<TransitionProps> = Symbol('fixture:page-transition')

/** Leave hook that waits until the test releases it with `__pageviewFixture.releaseLeaves()`. */
export function holdLeave(_element: Element, done: () => void) {
  window.__pageviewFixture.heldLeaves.push(done)
}
