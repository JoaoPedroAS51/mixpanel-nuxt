<script setup lang="ts">
import { useMixpanel } from '#imports'

useMixpanel().identify('setup-user')
useMixpanel().register({ plan: 'setup' })
</script>

<template>
  <FixturePage>Identified</FixturePage>
</template>
