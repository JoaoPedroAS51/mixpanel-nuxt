<script setup lang="ts">
import { definePageMeta, useHead } from '#imports'
import { holdLeave } from '../../utils/transitions'

definePageMeta({ pageTransition: { css: false, onLeave: holdLeave } })
useHead({ title: 'Titled meta transition' })
</script>

<template>
  <FixturePage>Titled meta transition</FixturePage>
</template>
