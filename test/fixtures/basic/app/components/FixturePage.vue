<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from '#imports'

const route = useRoute()
const ready = ref(false)

onMounted(() => {
  ready.value = true
})
</script>

<template>
  <main
    :data-ready="ready"
    :data-path="route.fullPath"
  >
    <slot />
  </main>
</template>
