<script setup lang="ts">
import { definePageMeta, useHead, useRoute } from '#imports'

definePageMeta({ key: 'shared' })

const route = useRoute()
useHead(() => ({ title: `Shared ${route.params.id}` }))
</script>

<template>
  <FixturePage>Shared key</FixturePage>
</template>
