<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMixpanel, navigateTo, useRoute } from '#imports'

defineOptions({ name: 'TrackingPage' })

const sdk = useMixpanel()
const route = useRoute()
const ready = ref(false)

sdk.track('setup_event')
sdk.people.set({ plan: 'test' })
sdk.get_group('org', 'test').set({ plan: 'test' })

onMounted(() => {
  ready.value = true
  window.__sdk = sdk
  window.__navigate = navigateTo
})
</script>

<template>
  <main
    :data-ready="ready"
    :data-path="route.fullPath"
  >
    <button @click="sdk.track('click_event')">
      Track event
    </button>
    <NuxtLink to="/two">Next page</NuxtLink>
  </main>
</template>
