<script setup lang="ts">
import { definePageMeta, useHead } from '#imports'
import { holdLeave } from '../../utils/transitions'

definePageMeta({ layout: 'pageview-first', layoutTransition: { css: false, onLeave: holdLeave } })
useHead({ title: 'First layout page' })
</script>

<template>
  <FixturePage>First layout</FixturePage>
</template>
