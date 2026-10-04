<script setup lang="ts">
import { definePageMeta } from '#imports'
import { holdLeave } from '../../utils/transitions'

definePageMeta({ layout: 'pageview-second', layoutTransition: { css: false, onLeave: holdLeave } })
</script>

<template>
  <FixturePage>Second layout</FixturePage>
</template>
