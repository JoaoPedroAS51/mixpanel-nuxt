<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHead, useRoute } from '#imports'

const titles: Record<string, string> = {
  '/first': 'First page',
  '/second': 'Second page',
}

const route = useRoute()
const ready = ref(false)

useHead(() => ({ title: titles[route.path] ?? 'No pages app' }))

onMounted(() => {
  ready.value = true
})
</script>

<template>
  <main
    :data-ready="ready"
    :data-path="route.fullPath"
  >
    <NuxtLink to="/second">Second page</NuxtLink>
  </main>
</template>
