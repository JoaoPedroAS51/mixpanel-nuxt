<script setup lang="ts">
import { definePageMeta } from '#imports'

definePageMeta({ mixpanel: { pageview: { properties: { area: 'child' } } } })
</script>

<template>
  <FixturePage>Nested child</FixturePage>
</template>
