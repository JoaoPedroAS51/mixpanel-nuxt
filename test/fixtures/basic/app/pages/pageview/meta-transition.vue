<script setup lang="ts">
import { definePageMeta } from '#imports'
import { holdLeave } from '../../utils/transitions'

definePageMeta({ pageTransition: { css: false, onLeave: holdLeave } })
</script>

<template>
  <FixturePage>Untitled meta transition</FixturePage>
</template>
