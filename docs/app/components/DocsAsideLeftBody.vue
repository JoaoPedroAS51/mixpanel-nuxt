<script setup lang="ts">
const { sidebarNavigation } = useDocsNavigation()
const variants = useUIConfig('contentNavigation')
</script>

<template>
  <UContentNavigation
    :collapsible="false"
    :highlight="variants.highlight ?? true"
    :highlight-color="variants.highlightColor"
    :variant="variants.variant ?? 'link'"
    :color="variants.color"
    :navigation="sidebarNavigation"
  />
</template>
