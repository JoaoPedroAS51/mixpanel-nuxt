<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({ mixpanel: { pageview: { properties: { section: 'nested', area: 'parent' } } } })
</script>

<template>
  <div>
    <NuxtPage />
  </div>
</template>
