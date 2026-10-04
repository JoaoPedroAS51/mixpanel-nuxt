<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({ mixpanel: { pageview: { properties: { section: 'static' } } } })
</script>

<template>
  <FixturePage>With properties</FixturePage>
</template>
