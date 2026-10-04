<script setup lang="ts">
import { inject } from 'vue'
import { pageTransitionKey } from './utils/transitions'

const transition = inject(pageTransitionKey, undefined)
</script>

<template>
  <NuxtLayout>
    <NuxtPage :transition="transition" />
  </NuxtLayout>
</template>
