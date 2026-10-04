<script setup lang="ts">
import { useFetch, useHead, useRoute } from '#imports'

const { data } = await useFetch('/api/pageview-title', { query: { page: useRoute().query.page } })
useHead(() => ({ title: data.value?.title }))
</script>

<template>
  <FixturePage>Async title</FixturePage>
</template>
