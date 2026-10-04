<script setup lang="ts">
import { useMixpanel } from '#imports'
import { shallowRef } from 'vue'

const mixpanel = useMixpanel()
const browserResult = shallowRef('No browser event yet.')
const browserPending = shallowRef(false)
const serverResult = shallowRef('No server event yet.')
const serverPending = shallowRef(false)

function trackBrowserEvent() {
  if (!mixpanel.get_config('token')) {
    browserResult.value = 'Browser tracking is inactive.'
    return
  }

  browserPending.value = true
  browserResult.value = 'Waiting for the browser SDK callback…'

  try {
    mixpanel.track('playground_browser_clicked', { source: 'playground' }, { send_immediately: true }, (response) => {
      browserResult.value = `SDK callback: ${JSON.stringify(response)}`
      browserPending.value = false
    })
  }
  catch (error) {
    browserResult.value = error instanceof Error ? error.message : String(error)
    browserPending.value = false
  }
}

async function trackServerEvent() {
  serverPending.value = true
  serverResult.value = 'Waiting for the Node SDK callback…'

  try {
    const result = await $fetch('/api/mixpanel', { method: 'POST' })
    serverResult.value = JSON.stringify(result, null, 2)
  }
  catch (error) {
    serverResult.value = error instanceof Error ? error.message : String(error)
  }
  finally {
    serverPending.value = false
  }
}
</script>

<template>
  <main class="playground">
    <h1>Mixpanel Nuxt playground</h1>
    <p>The configured tokens are placeholders. SDK callbacks may report an error.</p>

    <section>
      <h2>Browser SDK</h2>
      <p>Calls <code>useMixpanel().track()</code> directly. Debug output appears in the browser console.</p>
      <button
        :disabled="browserPending"
        @click="trackBrowserEvent"
      >
        {{ browserPending ? 'Tracking…' : 'Track browser event' }}
      </button>
      <pre
        class="result"
        aria-live="polite"
      >{{ browserResult }}</pre>
    </section>

    <section>
      <h2>Node SDK in Nitro</h2>
      <p>Calls <code>POST /api/mixpanel</code> with an explicit identity. Debug output appears in the server terminal.</p>
      <button
        :disabled="serverPending"
        @click="trackServerEvent"
      >
        {{ serverPending ? 'Tracking…' : 'Track server event' }}
      </button>
      <pre
        class="result"
        aria-live="polite"
      >{{ serverResult }}</pre>
    </section>
  </main>
</template>

<style scoped>
.playground {
  max-width: 48rem;
  margin: 3rem auto;
  padding: 0 1rem;
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}

.result {
  overflow: auto;
  padding: 1rem;
  background: #f3f4f6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
