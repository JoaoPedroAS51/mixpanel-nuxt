<script setup lang="ts">
const { sections, sidebarNavigation } = useDocsNavigation()
const variants = useUIConfig('contentNavigation')
</script>

<template>
  <UNavigationMenu
    :items="sections"
    class="mb-4"
  />

  <UContentNavigation
    :collapsible="false"
    :highlight="variants.highlight ?? true"
    :highlight-color="variants.highlightColor"
    :variant="variants.variant ?? 'link'"
    :color="variants.color"
    :navigation="sidebarNavigation"
  />
</template>
